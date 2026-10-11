# ============================================================
# ASSIGNMENT: FINE-TUNE BERT ON A CUSTOM CLASSIFICATION DATASET
# Dataset: UCI SMS Spam Collection
# Model: bert-base-uncased
# Framework: PyTorch + Hugging Face Trainer
# ============================================================

import os
import random
import zipfile
import urllib.request
import inspect
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import torch

from IPython.display import display
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix
)
from torch.utils.data import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
    set_seed
)

# ------------------------------------------------------------
# 1. ENVIRONMENT SETUP AND REPRODUCIBILITY
# ------------------------------------------------------------

SEED = 42
set_seed(SEED)
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

print("PyTorch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
print("Device:", "GPU" if torch.cuda.is_available() else "CPU")

# Create project directories
DATA_DIR = Path("data")
OUTPUT_DIR = Path("outputs")
DATA_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# ------------------------------------------------------------
# 2. DATASET ACQUISITION AND LOADING
# ------------------------------------------------------------

# Source: UCI Machine Learning Repository
# Dataset: SMS Spam Collection
# Classes: ham (normal message), spam (spam message)

dataset_file = DATA_DIR / "SMSSpamCollection"
zip_file = DATA_DIR / "sms_spam_collection.zip"

if not dataset_file.exists():
    print("\nDownloading SMS Spam Collection dataset...")

    dataset_url = (
        "https://archive.ics.uci.edu/static/public/228/"
        "sms+spam+collection.zip"
    )

    urllib.request.urlretrieve(dataset_url, zip_file)

    with zipfile.ZipFile(zip_file, "r") as archive:
        matching_files = [
            name for name in archive.namelist()
            if name.endswith("SMSSpamCollection")
        ]

        if not matching_files:
            raise FileNotFoundError(
                "SMSSpamCollection was not found inside the downloaded ZIP."
            )

        with archive.open(matching_files[0]) as source:
            with open(dataset_file, "wb") as destination:
                destination.write(source.read())

df = pd.read_csv(
    dataset_file,
    sep="\t",
    header=None,
    names=["label", "text"],
    encoding="utf-8"
)

# Basic preprocessing
df = df.dropna(subset=["label", "text"]).copy()
df["label"] = df["label"].astype(str).str.strip().str.lower()
df["text"] = df["text"].astype(str).str.strip()

# Remove empty texts and unexpected labels
df = df[df["text"].str.len() > 0]
df = df[df["label"].isin(["ham", "spam"])]

# Remove exact duplicate records for cleaner evaluation
df = df.drop_duplicates(subset=["label", "text"]).reset_index(drop=True)

print("\nDATASET DESCRIPTION")
print("Source: UCI Machine Learning Repository")
print("Task: Binary SMS spam classification")
print("Total samples:", len(df))
print("Number of classes:", df["label"].nunique())
print("\nClass distribution:")
print(df["label"].value_counts())
print("\nClass distribution (%):")
print((df["label"].value_counts(normalize=True) * 100).round(2))
print("\nDataset preview:")
print(df.head())

# Visualize the class distribution
plt.figure(figsize=(6, 4))
sns.countplot(data=df, x="label")
plt.title("SMS Spam Dataset: Class Distribution")
plt.xlabel("Class")
plt.ylabel("Number of messages")
plt.tight_layout()
plt.show()

# ------------------------------------------------------------
# 3. LABEL ENCODING AND STRATIFIED DATA SPLITTING
# ------------------------------------------------------------

label_encoder = LabelEncoder()
df["label_id"] = label_encoder.fit_transform(df["label"])

label2id = {
    label: int(label_encoder.transform([label])[0])
    for label in label_encoder.classes_
}
id2label = {value: key for key, value in label2id.items()}

print("\nLabel mapping:", label2id)

# First: 70% training, 30% temporary
train_df, temp_df = train_test_split(
    df,
    test_size=0.30,
    random_state=SEED,
    stratify=df["label_id"]
)

# Then split temporary equally: 15% validation, 15% test overall
val_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    random_state=SEED,
    stratify=temp_df["label_id"]
)

def print_split_stats(name, split_df):
    print(f"\n{name} set")
    print("Shape:", split_df.shape)
    print("Class counts:")
    print(split_df["label"].value_counts())
    print("Class percentages:")
    print(
        (split_df["label"].value_counts(normalize=True) * 100)
        .round(2)
    )

print_split_stats("Training", train_df)
print_split_stats("Validation", val_df)
print_split_stats("Test", test_df)

# ------------------------------------------------------------
# 4. LOAD PRE-TRAINED BERT TOKENIZER
# ------------------------------------------------------------

MODEL_NAME = "bert-base-uncased"
MAX_LENGTH = 128

# BERT base uncased uses a 12-layer Transformer encoder.
# It lowercases text and uses WordPiece tokenization.
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

print("\nTokenizer:", MODEL_NAME)
print("Vocabulary size:", tokenizer.vocab_size)
print("Maximum sequence length used:", MAX_LENGTH)

# ------------------------------------------------------------
# 5. TOKENIZATION AND PYTORCH DATASET
# ------------------------------------------------------------

class SMSClassificationDataset(Dataset):
    def __init__(self, dataframe, tokenizer, max_length=128):
        self.texts = dataframe["text"].tolist()
        self.labels = dataframe["label_id"].astype(int).tolist()

        self.encodings = tokenizer(
            self.texts,
            truncation=True,
            padding="max_length",
            max_length=max_length,
            return_tensors="pt"
        )

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, index):
        item = {
            key: value[index]
            for key, value in self.encodings.items()
        }
        item["labels"] = torch.tensor(
            self.labels[index],
            dtype=torch.long
        )
        return item

train_dataset = SMSClassificationDataset(
    train_df, tokenizer, MAX_LENGTH
)
val_dataset = SMSClassificationDataset(
    val_df, tokenizer, MAX_LENGTH
)
test_dataset = SMSClassificationDataset(
    test_df, tokenizer, MAX_LENGTH
)

# Verify tokenization for the first five training samples
sample_encoding = tokenizer(
    train_df["text"].head(5).tolist(),
    truncation=True,
    padding="max_length",
    max_length=MAX_LENGTH,
    return_tensors="pt"
)

print("\nTOKENIZATION VERIFICATION")
print("Input IDs shape:", sample_encoding["input_ids"].shape)
print("Attention mask shape:", sample_encoding["attention_mask"].shape)
print("Input IDs dtype:", sample_encoding["input_ids"].dtype)
print("Attention mask dtype:", sample_encoding["attention_mask"].dtype)
print("\nFirst sample text:")
print(train_df["text"].iloc[0])
print("\nFirst sample tokens:")
print(tokenizer.convert_ids_to_tokens(
    sample_encoding["input_ids"][0].tolist()
)[:25])

print("\nSpecial tokens:")
print("CLS:", tokenizer.cls_token)
print("SEP:", tokenizer.sep_token)
print("PAD:", tokenizer.pad_token)

# ------------------------------------------------------------
# 6. LOAD PRE-TRAINED BERT CLASSIFICATION MODEL
# ------------------------------------------------------------

num_labels = len(label_encoder.classes_)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=num_labels,
    id2label=id2label,
    label2id=label2id
)

print("\nMODEL ARCHITECTURE")
print(model)
print("\nTotal parameters:",
      f"{sum(p.numel() for p in model.parameters()):,}")
print("Trainable parameters:",
      f"{sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

# ------------------------------------------------------------
# 7. DEFINE EVALUATION METRICS
# ------------------------------------------------------------

def compute_metrics(eval_prediction):
    logits = eval_prediction.predictions
    labels = eval_prediction.label_ids

    # Some models can return tuples; take logits if so.
    if isinstance(logits, tuple):
        logits = logits[0]

    predictions = np.argmax(logits, axis=-1)

    precision, recall, f1, _ = precision_recall_fscore_support(
        labels,
        predictions,
        average="weighted",
        zero_division=0
    )

    return {
        "accuracy": accuracy_score(labels, predictions),
        "precision": precision,
        "recall": recall,
        "f1": f1
    }

# ------------------------------------------------------------
# 8. CONFIGURE TRAINING ARGUMENTS
# ------------------------------------------------------------

# Use a small batch size for compatibility with modest hardware.
# Three epochs provide a reasonable initial fine-tuning experiment.
# Evaluate and save once per epoch; select the best validation F1.
training_config = {
    "output_dir": str(OUTPUT_DIR / "checkpoints"),
    "num_train_epochs": 3,
    "per_device_train_batch_size": 8,
    "per_device_eval_batch_size": 16,
    "learning_rate": 2e-5,
    "warmup_steps": 0,
    "weight_decay": 0.01,
    "logging_steps": 50,
    "save_strategy": "epoch",
    "load_best_model_at_end": True,
    "metric_for_best_model": "f1",
    "greater_is_better": True,
    "save_total_limit": 2,
    "report_to": "none",
    "seed": SEED,
    "fp16": torch.cuda.is_available()
}

# Transformers versions use either eval_strategy or
# evaluation_strategy. Detect the supported argument.
training_args_parameters = inspect.signature(
    TrainingArguments.__init__
).parameters

if "eval_strategy" in training_args_parameters:
    training_config["eval_strategy"] = "epoch"
else:
    training_config["evaluation_strategy"] = "epoch"

training_args = TrainingArguments(**training_config)

print("\nTRAINING CONFIGURATION")
print(training_args)

# ------------------------------------------------------------
# 9. CREATE TRAINER AND FINE-TUNE BERT
# ------------------------------------------------------------

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    compute_metrics=compute_metrics
)

print("\nStarting BERT fine-tuning...")
train_result = trainer.train()

print("\nTRAINING RESULTS")
print(train_result.metrics)

# Save the best selected model and tokenizer
BEST_MODEL_DIR = OUTPUT_DIR / "best_model"
trainer.save_model(str(BEST_MODEL_DIR))
tokenizer.save_pretrained(str(BEST_MODEL_DIR))

print("\nBest model saved to:", BEST_MODEL_DIR)

# ------------------------------------------------------------
# 10. VALIDATION EVALUATION
# ------------------------------------------------------------

print("\nVALIDATION SET RESULTS")
validation_metrics = trainer.evaluate(
    eval_dataset=val_dataset,
    metric_key_prefix="validation"
)

for metric, value in validation_metrics.items():
    if isinstance(value, (int, float)):
        print(f"{metric}: {value:.4f}")

# ------------------------------------------------------------
# 11. FINAL TEST SET EVALUATION
# ------------------------------------------------------------

print("\nFINAL TEST SET EVALUATION")

test_metrics = trainer.evaluate(
    eval_dataset=test_dataset,
    metric_key_prefix="test"
)

for metric, value in test_metrics.items():
    if isinstance(value, (int, float)):
        print(f"{metric}: {value:.4f}")

# Get predictions for detailed analysis
prediction_output = trainer.predict(test_dataset)
test_logits = prediction_output.predictions

if isinstance(test_logits, tuple):
    test_logits = test_logits[0]

test_predictions = np.argmax(test_logits, axis=-1)
test_true_labels = prediction_output.label_ids

print("\nCLASSIFICATION REPORT")
print(
    classification_report(
        test_true_labels,
        test_predictions,
        labels=list(range(num_labels)),
        target_names=[
            id2label[i] for i in range(num_labels)
        ],
        zero_division=0
    )
)

# ------------------------------------------------------------
# 12. CONFUSION MATRIX
# ------------------------------------------------------------

cm = confusion_matrix(
    test_true_labels,
    test_predictions,
    labels=list(range(num_labels))
)

plt.figure(figsize=(6, 5))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=[id2label[i] for i in range(num_labels)],
    yticklabels=[id2label[i] for i in range(num_labels)]
)
plt.xlabel("Predicted label")
plt.ylabel("True label")
plt.title("BERT Test Set Confusion Matrix")
plt.tight_layout()
plt.show()

# ------------------------------------------------------------
# 13. TRAINING LOSS AND VALIDATION METRICS
# ------------------------------------------------------------

history = trainer.state.log_history
history_df = pd.DataFrame(history)

if not history_df.empty:
    print("\nTRAINING LOG HISTORY")
    display(history_df)

    if "loss" in history_df.columns:
        train_loss_df = history_df.dropna(subset=["loss"])

        if not train_loss_df.empty:
            plt.figure(figsize=(8, 4))
            plt.plot(
                train_loss_df["step"],
                train_loss_df["loss"],
                marker="o",
                label="Training loss"
            )
            plt.xlabel("Training step")
            plt.ylabel("Loss")
            plt.title("BERT Training Loss")
            plt.legend()
            plt.tight_layout()
            plt.show()

    if "eval_f1" in history_df.columns:
        eval_df = history_df.dropna(subset=["eval_f1"])

        if not eval_df.empty:
            plt.figure(figsize=(8, 4))
            plt.plot(
                eval_df["epoch"],
                eval_df["eval_f1"],
                marker="o",
                label="Validation F1"
            )
            plt.plot(
                eval_df["epoch"],
                eval_df["eval_loss"],
                marker="s",
                label="Validation loss"
            )
            plt.xlabel("Epoch")
            plt.title("Validation Performance During Training")
            plt.legend()
            plt.tight_layout()
            plt.show()

# ------------------------------------------------------------
# 14. QUALITATIVE ANALYSIS: CHALLENGING TEST SAMPLES
# ------------------------------------------------------------

# Select up to five test cases where the model was least confident.
# This helps inspect difficult examples instead of only easy ones.

probabilities = torch.softmax(
    torch.tensor(test_logits),
    dim=-1
).numpy()

confidence_scores = probabilities.max(axis=1)
predicted_labels = [
    id2label[int(pred)] for pred in test_predictions
]
true_labels = [
    id2label[int(label)] for label in test_true_labels
]

analysis_df = test_df.reset_index(drop=True).copy()
analysis_df["true_label"] = true_labels
analysis_df["predicted_label"] = predicted_labels
analysis_df["confidence"] = confidence_scores
analysis_df["correct"] = (
    analysis_df["true_label"] == analysis_df["predicted_label"]
)

challenging_samples = analysis_df.sort_values(
    "confidence",
    ascending=True
).head(min(5, len(analysis_df)))

print("\nCHALLENGING TEST SAMPLES")
display(
    challenging_samples[
        [
            "text",
            "true_label",
            "predicted_label",
            "confidence",
            "correct"
        ]
    ]
)

# ------------------------------------------------------------
# 15. SIMPLE BASELINE COMPARISON
# ------------------------------------------------------------

# Majority-class baseline: always predict the most common
# training class. This is a simple reference, not a strong model.

majority_label = int(
    train_df["label_id"].value_counts().idxmax()
)

baseline_predictions = np.full(
    len(test_true_labels),
    majority_label
)

baseline_accuracy = accuracy_score(
    test_true_labels,
    baseline_predictions
)

baseline_precision, baseline_recall, baseline_f1, _ = (
    precision_recall_fscore_support(
        test_true_labels,
        baseline_predictions,
        average="weighted",
        zero_division=0
    )
)

comparison_df = pd.DataFrame(
    [
        {
            "Model": "Majority-class baseline",
            "Accuracy": baseline_accuracy,
            "Precision (weighted)": baseline_precision,
            "Recall (weighted)": baseline_recall,
            "F1 (weighted)": baseline_f1
        },
        {
            "Model": "Fine-tuned BERT",
            "Accuracy": test_metrics.get("test_accuracy", np.nan),
            "Precision (weighted)": test_metrics.get(
                "test_precision", np.nan
            ),
            "Recall (weighted)": test_metrics.get(
                "test_recall", np.nan
            ),
            "F1 (weighted)": test_metrics.get("test_f1", np.nan)
        }
    ]
)

print("\nBASELINE VS BERT")
display(comparison_df.round(4))

# ------------------------------------------------------------
# 16. AUTOMATED RESULT INTERPRETATION
# ------------------------------------------------------------

train_loss_values = [
    row["loss"]
    for row in history
    if "loss" in row and "eval_loss" not in row
]

val_loss_values = [
    row["eval_loss"]
    for row in history
    if "eval_loss" in row
]

test_accuracy = test_metrics.get("test_accuracy", float("nan"))
test_f1 = test_metrics.get("test_f1", float("nan"))
val_f1 = validation_metrics.get("validation_f1", float("nan"))

print("\nRESULT ANALYSIS")
print(f"Test accuracy: {test_accuracy:.4f}")
print(f"Test weighted F1: {test_f1:.4f}")
print(f"Best selected model validation F1: {val_f1:.4f}")

if not np.isnan(test_accuracy) and test_accuracy > baseline_accuracy:
    print("BERT outperformed the majority-class baseline on accuracy.")
else:
    print(
        "BERT did not outperform the majority baseline on accuracy. "
        "Inspect data, training logs, and hyperparameters."
    )

if len(train_loss_values) >= 2:
    if train_loss_values[-1] < train_loss_values[0]:
        print("Training loss decreased over recorded training steps.")
    else:
        print("Training loss did not decrease consistently.")

if val_loss_values:
    print(
        "Validation loss across evaluations:",
        [round(value, 4) for value in val_loss_values]
    )
    print(
        "Compare training and validation loss curves for signs "
        "of overfitting. A widening gap can be a warning sign."
    )

print(
    "\nNote: conclusions about overfitting should be based on the "
    "actual loss curves and metrics, not accuracy alone."
)

# ------------------------------------------------------------
# 17. REFLECTION AND FUTURE WORK
# ------------------------------------------------------------

print("""
REFLECTION AND FUTURE WORK

1. Challenges:
   - CPU training may take longer than GPU training.
   - SMS labels are imbalanced, so accuracy alone is insufficient.
   - Longer messages require truncation or a larger max_length.
   - Memory limitations can require smaller batch sizes.

2. Improvements:
   - Compare DistilBERT, RoBERTa, or other pretrained models.
   - Tune learning rate, batch size, epochs, and weight decay.
   - Use class-weighted loss or sampling if minority-class results
     are weak.
   - Inspect misclassified samples and improve data quality.
   - Use cross-validation or hyperparameter search where practical.

3. Learnings:
   - Tokenization converts text into model inputs.
   - Fine-tuning adapts pretrained representations to a new task.
   - Precision, recall, and F1 complement accuracy.
   - Transfer learning generally needs less task-specific data and
     computation than training a language model from scratch.
""")

print("\nASSIGNMENT PIPELINE COMPLETED.")