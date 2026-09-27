import argparse  # Built-in module for parsing command-line arguments
from utils import add, subtract, multiply, divide  # Import our custom functions

def main():
    # Create an ArgumentParser object to handle arguments
    parser = argparse.ArgumentParser(description="Simple CLI Calculator")

    # Define arguments: operation, a, and b
    parser.add_argument("operation", choices=["add", "sub", "mul", "div"], help="Operation to perform")
    parser.add_argument("a", type=float, help="First number")
    parser.add_argument("b", type=float, help="Second number")

    # Parse the arguments into a Namespace object
    args = parser.parse_args()

    # Perform operation based on user input
    if args.operation == "add":
        print(add(args.a, args.b))
    elif args.operation == "sub":
        print(subtract(args.a, args.b))
    elif args.operation == "mul":
        print(multiply(args.a, args.b))
    elif args.operation == "div":
        print(divide(args.a, args.b))

# Ensure this runs only when the script is executed directly
if __name__ == "__main__":
    main()