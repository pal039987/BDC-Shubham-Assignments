# ============================================================
# ASSIGNMENT: LoRA-BASED ADAPTER TRAINING FOR A SMALL GPT MODEL
# Base model: distilgpt2
# Dataset: DailyDialog
# Framework: PyTorch + Transformers + PEFT
# ============================================================

import os
import inspect
import random
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import matplotlib.pyplot as plt

from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
    set_seed,
)
from peft import LoraConfig, TaskType, get_peft_model, PeftModel


# ============================================================
# 1. CONFIGURATION AND REPRODUCIBILITY
# ============================================================

SEED = 42
MODEL_NAME = "distilgpt2"
MAX_LENGTH = 128

OUTPUT_DIR = Path("outputs")
ADAPTER_DIR = OUTPUT_DIR / "lora_adapter"
CHECKPOINT_DIR = OUTPUT_DIR / "checkpoints"
DATA_DIR = Path("data")

for directory in [OUTPUT_DIR, ADAPTER_DIR, CHECKPOINT_DIR, DATA_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
set_seed(SEED)

if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("PyTorch version:", torch.__version__)
print("Device:", DEVICE)
print("CUDA available:", torch.cuda.is_available())


# ============================================================
# 2. LOAD AND PREPARE THE DAILYDIALOG DATASET
# ============================================================

print("\nLoading DailyDialog dataset...")

# The datasets library downloads and caches the dataset.
# Internet access is required for the first run.
print("\nLoading DailyDialog dataset...")

base_url = (
    "https://huggingface.co/datasets/roskoN/dailydialog/"
    "resolve/refs%2Fconvert%2Fparquet/full/"
)

dataset = load_dataset(
    "parquet",
    data_files={
        "train": base_url + "train/0000.parquet",
        "validation": base_url + "validation/0000.parquet",
        "test": base_url + "test/0000.parquet",
    },
)

print(dataset)
print("Available splits:", list(dataset.keys()))

# Each dialogue is a list of utterances.
# Format it as one causal-language-modeling text sample.
def format_dialogue(example):
    utterances = example["utterances"]

    text = "\n".join(
        f"Speaker {(i % 2) + 1}: {utterance.strip()}"
        for i, utterance in enumerate(utterances)
        if isinstance(utterance, str) and utterance.strip()
    )

    return {"text": text}


train_raw = dataset["train"].map(format_dialogue)
validation_raw = dataset["validation"].map(format_dialogue)
test_raw = dataset["test"].map(format_dialogue)

# Remove empty dialogues.
train_raw = train_raw.filter(lambda x: bool(x["text"].strip()))
validation_raw = validation_raw.filter(lambda x: bool(x["text"].strip()))
test_raw = test_raw.filter(lambda x: bool(x["text"].strip()))

print("\nDATASET DESCRIPTION")
print("Source: DailyDialog, a public everyday-dialogue dataset")
print("Task: Conversational text generation")
print("Training dialogues:", len(train_raw))
print("Validation dialogues:", len(validation_raw))
print("Test dialogues:", len(test_raw))

if len(train_raw) < 500:
    raise ValueError(
        "The training split has fewer than 500 samples. "
        "Check the downloaded dataset."
    )

# Display a few samples.
for i in range(min(3, len(train_raw))):
    print(f"\nSample {i + 1}:")
    print(train_raw[i]["text"][:500])

# Dataset statistics.
train_lengths = [len(x["text"].split()) for x in train_raw]

print("\nAverage training dialogue length (words):",
      round(float(np.mean(train_lengths)), 2))
print("Median training dialogue length (words):",
      round(float(np.median(train_lengths)), 2))
print("Maximum training dialogue length (words):",
      max(train_lengths))

plt.figure(figsize=(8, 4))
plt.hist(train_lengths, bins=40)
plt.title("DailyDialog Training Dialogue Lengths")
plt.xlabel("Words per dialogue")
plt.ylabel("Number of dialogues")
plt.tight_layout()
plt.savefig(DATA_DIR / "dialogue_lengths.png")
plt.show()


# ============================================================
# 3. LOAD TOKENIZER AND TOKENIZE THE DATASET
# ============================================================

print("\nLoading tokenizer:", MODEL_NAME)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# GPT-2-style tokenizers normally do not have a separate pad token.
# Use EOS as padding and mask padded labels in the collator.
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

def tokenize_batch(batch):
    return tokenizer(
        batch["text"],
        truncation=True,
        max_length=MAX_LENGTH,
        padding="max_length",
    )


tokenized_train = train_raw.map(
    tokenize_batch,
    batched=True,
    remove_columns=train_raw.column_names,
)

tokenized_validation = validation_raw.map(
    tokenize_batch,
    batched=True,
    remove_columns=validation_raw.column_names,
)

tokenized_test = test_raw.map(
    tokenize_batch,
    batched=True,
    remove_columns=test_raw.column_names,
)

# Trainer expects tensors from the dataset.
tokenized_train.set_format(
    type="torch",
    columns=["input_ids", "attention_mask"],
)
tokenized_validation.set_format(
    type="torch",
    columns=["input_ids", "attention_mask"],
)
tokenized_test.set_format(
    type="torch",
    columns=["input_ids", "attention_mask"],
)

sample = tokenized_train[0]

print("\nTOKENIZATION VERIFICATION")
print("Input IDs shape:", sample["input_ids"].shape)
print("Attention mask shape:", sample["attention_mask"].shape)
print(
    "Decoded sample:",
    tokenizer.decode(sample["input_ids"], skip_special_tokens=True)[:400],
)


# ============================================================
# 4. LOAD THE PRETRAINED CAUSAL LANGUAGE MODEL
# ============================================================

print("\nLoading base model:", MODEL_NAME)

base_model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
base_model.config.pad_token_id = tokenizer.pad_token_id

# Use cache during generation, but disable it during training.
base_model.config.use_cache = False

total_parameters = sum(p.numel() for p in base_model.parameters())

print("\nBASE MODEL ARCHITECTURE")
print(base_model)
print(f"\nTotal base-model parameters: {total_parameters:,}")


# ============================================================
# 5. CONFIGURE AND APPLY LoRA
# ============================================================

# GPT-2 / DistilGPT-2 attention uses a combined Conv1D projection
# named c_attn. LoRA can be applied to this projection.
#
# r=8: small low-rank update matrices, fewer trainable parameters.
# alpha=16: LoRA scaling factor; effective scale is alpha / r.
# dropout=0.1: regularization applied to LoRA inputs.
# bias='none': base bias parameters are not trained.
# fan_in_fan_out=True: appropriate for GPT-2 Conv1D weight layout.

lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,
    lora_alpha=16,
    target_modules=["c_attn"],
    lora_dropout=0.1,
    bias="none",
    fan_in_fan_out=True,
)

peft_model = get_peft_model(base_model, lora_config)

print("\nLoRA-WRAPPED MODEL")
peft_model.print_trainable_parameters()

trainable_parameters = sum(
    p.numel()
    for p in peft_model.parameters()
    if p.requires_grad
)

print(f"Total base-model parameters: {total_parameters:,}")
print(f"Trainable LoRA parameters: {trainable_parameters:,}")
print(
    "Trainable percentage:",
    round(100 * trainable_parameters / total_parameters, 4),
    "%",
)

# Training requires gradients; the Trainer manages device placement.
peft_model.config.use_cache = False


# ============================================================
# 6. DATA COLLATOR FOR CAUSAL LANGUAGE MODELING
# ============================================================

# mlm=False means causal language modeling, not masked language modeling.
# Labels are created from input_ids. Padding tokens are ignored in loss.
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False,
)


# ============================================================
# 7. TRAINING ARGUMENTS
# ============================================================

# Conservative settings for CPU or a modest GPU:
# batch size 2, gradient accumulation 4 => effective batch size 8
# learning rate 2e-4 is a common starting point for LoRA adapters.
#
# TrainingArguments differs between Transformers releases, so this
# section only passes arguments supported by the installed version.

training_config = {
    "output_dir": str(CHECKPOINT_DIR),
    "num_train_epochs": 3,
    "per_device_train_batch_size": 2,
    "per_device_eval_batch_size": 2,
    "gradient_accumulation_steps": 4,
    "learning_rate": 2e-4,
    "weight_decay": 0.01,
    "logging_steps": 50,
    "save_steps": 200,
    "save_total_limit": 2,
    "report_to": "none",
    "seed": SEED,
}

supported_arguments = inspect.signature(
    TrainingArguments.__init__
).parameters

if "eval_strategy" in supported_arguments:
    training_config["eval_strategy"] = "epoch"
elif "evaluation_strategy" in supported_arguments:
    training_config["evaluation_strategy"] = "epoch"

if "save_strategy" in supported_arguments:
    training_config["save_strategy"] = "epoch"

# Only enable best-model loading if the installed version supports
# compatible evaluation and saving strategies.
if (
    "load_best_model_at_end" in supported_arguments
    and "metric_for_best_model" in supported_arguments
):
    training_config["load_best_model_at_end"] = True
    training_config["metric_for_best_model"] = "eval_loss"
    training_config["greater_is_better"] = False

if "logging_dir" in supported_arguments:
    training_config["logging_dir"] = str(OUTPUT_DIR / "logs")

if "fp16" in supported_arguments:
    training_config["fp16"] = bool(torch.cuda.is_available())

if "dataloader_pin_memory" in supported_arguments:
    training_config["dataloader_pin_memory"] = bool(
        torch.cuda.is_available()
    )

# Filter unsupported keyword arguments for compatibility.
training_config = {
    key: value
    for key, value in training_config.items()
    if key in supported_arguments
}

training_args = TrainingArguments(**training_config)

print("\nTRAINING ARGUMENTS")
print(training_args)


# ============================================================
# 8. CREATE TRAINER AND TRAIN
# ============================================================

trainer_parameters = inspect.signature(Trainer.__init__).parameters

trainer_kwargs = {
    "model": peft_model,
    "args": training_args,
    "train_dataset": tokenized_train,
    "eval_dataset": tokenized_validation,
    "data_collator": data_collator,
}

# Newer releases use processing_class; older ones use tokenizer.
if "processing_class" in trainer_parameters:
    trainer_kwargs["processing_class"] = tokenizer
elif "tokenizer" in trainer_parameters:
    trainer_kwargs["tokenizer"] = tokenizer

trainer = Trainer(**trainer_kwargs)

print("\nStarting LoRA training...")
train_result = trainer.train()

print("\nTRAINING METRICS")
print(train_result.metrics)

print("\nVALIDATION EVALUATION")
validation_metrics = trainer.evaluate(
    eval_dataset=tokenized_validation
)
print(validation_metrics)


# ============================================================
# 9. SAVE ONLY THE LoRA ADAPTERS
# ============================================================

# PEFT saves the adapter configuration and adapter weights,
# not a full independent copy of all base-model weights.
peft_model.save_pretrained(str(ADAPTER_DIR))
tokenizer.save_pretrained(str(ADAPTER_DIR))

print("\nLoRA adapters saved to:", ADAPTER_DIR.resolve())

adapter_files = list(ADAPTER_DIR.glob("*"))
print("Saved adapter files:")
for file_path in adapter_files:
    print(" -", file_path.name, f"({file_path.stat().st_size / 1024:.1f} KB)")


# ============================================================
# 10. PLOT TRAINING AND VALIDATION LOSS
# ============================================================

history = pd.DataFrame(trainer.state.log_history)

if not history.empty:
    print("\nTRAINING LOG")
    print(history.to_string(index=False))

    if "loss" in history.columns:
        train_history = history.dropna(subset=["loss"])

        if not train_history.empty:
            plt.figure(figsize=(8, 4))
            plt.plot(
                train_history["step"],
                train_history["loss"],
                marker="o",
                label="Training loss",
            )
            plt.xlabel("Step")
            plt.ylabel("Loss")
            plt.title("LoRA Training Loss")
            plt.legend()
            plt.tight_layout()
            plt.savefig(OUTPUT_DIR / "training_loss.png")
            plt.show()

    if "eval_loss" in history.columns:
        eval_history = history.dropna(subset=["eval_loss"])

        if not eval_history.empty:
            plt.figure(figsize=(8, 4))
            plt.plot(
                eval_history["step"],
                eval_history["eval_loss"],
                marker="o",
                label="Validation loss",
            )
            plt.xlabel("Step")
            plt.ylabel("Loss")
            plt.title("LoRA Validation Loss")
            plt.legend()
            plt.tight_layout()
            plt.savefig(OUTPUT_DIR / "validation_loss.png")
            plt.show()


# ============================================================
# 11. TEST SET EVALUATION
# ============================================================

print("\nTEST SET EVALUATION")

test_metrics = trainer.evaluate(
    eval_dataset=tokenized_test,
    metric_key_prefix="test",
)
print(test_metrics)

# Perplexity = exp(loss), a common causal-language-modeling metric.
test_loss = test_metrics.get("test_loss")

if test_loss is not None and np.isfinite(test_loss) and test_loss < 50:
    print("Test perplexity:", round(float(np.exp(test_loss)), 4))
else:
    print("Test perplexity not computed because test loss was unavailable.")


# ============================================================
# 12. GENERATE TEXT FOR THREE DISTINCT PROMPTS
# ============================================================

peft_model.eval()
peft_model.config.use_cache = True

prompts = [
    "Speaker 1: Hello! How are you today?\nSpeaker 2:",
    "Speaker 1: What do you usually do on weekends?\nSpeaker 2:",
    "Speaker 1: Can you help me find the nearest restaurant?\nSpeaker 2:",
]

def generate_response(prompt, model, max_new_tokens=45):
    inputs = tokenizer(prompt, return_tensors="pt")

    # Put inputs on the same device as the model.
    model_device = next(model.parameters()).device
    inputs = {key: value.to(model_device) for key, value in inputs.items()}

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.8,
            top_k=50,
            top_p=0.9,
            repetition_penalty=1.15,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    return tokenizer.decode(
        output_ids[0],
        skip_special_tokens=True,
    )


print("\nQUALITATIVE GENERATION RESULTS")

for index, prompt in enumerate(prompts, start=1):
    print(f"\nPrompt {index}:")
    print(prompt)

    generated_text = generate_response(prompt, peft_model)
    print("\nGenerated text:")
    print(generated_text)


# ============================================================
# 13. RELOAD BASE MODEL + SAVED LoRA ADAPTER
# ============================================================

print("\nReloading base model and saved LoRA adapter...")

reloaded_base = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
reloaded_base.config.pad_token_id = tokenizer.pad_token_id

reloaded_model = PeftModel.from_pretrained(
    reloaded_base,
    str(ADAPTER_DIR),
)

reloaded_model.eval()

reload_prompt = "Speaker 1: Thank you for your help.\nSpeaker 2:"

print("\nRELOADED ADAPTER GENERATION")
print("Prompt:", reload_prompt)
print(
    generate_response(
        reload_prompt,
        reloaded_model,
        max_new_tokens=40,
    )
)


# ============================================================
# 14. REFLECTION AND FUTURE WORK
# ============================================================

print("""
REFLECTION

1. LoRA benefits:
   - Most base-model weights remain frozen.
   - Only a small number of adapter parameters are trained.
   - Adapter files are much smaller than complete model checkpoints.
   - The same base model can be reused with different adapters.

2. Limitations:
   - LoRA cannot guarantee better results than full fine-tuning.
   - The base model still must be downloaded and loaded.
   - Small models may produce repetitive or factually incorrect text.
   - Dataset quality and prompt format affect generation quality.

3. Hyperparameters:
   - Increasing r gives adapters more capacity but adds trainable parameters.
   - lora_alpha controls the scaling of the LoRA update.
   - Excessive learning rates or epochs can harm generation quality.
   - Validation loss helps detect overfitting.

4. Future improvements:
   - Compare different ranks and learning rates.
   - Try a larger or different pretrained model if resources permit.
   - Improve dialogue formatting and filtering.
   - Evaluate generations with human review and task-specific metrics.

5. Transfer learning:
   - The model already knows general language patterns.
   - LoRA adapts selected layers without updating every base-model weight.
""")

print("\nLoRA ASSIGNMENT PIPELINE COMPLETED.")