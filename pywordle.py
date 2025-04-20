import random
import requests
from colorama import Fore, Back, Style, init

init(autoreset=True)

DEBUG = True  # ← Set to True to choose your own word

def main():
    print("Welcome to Wordle!\n")
    word = gen()
    game(word)

def game(word):
    guesses = [[" "] * 5 for _ in range(6)]
    turn = 0

    print_guesses(guesses, word)

    while turn < 6:
        guess_str = input_guess()
        guess = list(guess_str)
        guesses[turn] = guess

        print_guesses(guesses, word)

        if guess_str == word:
            print("\nYou win!")
            return

        turn += 1

    print("\nYou lost!")
    print("The word was: " + word)

def print_guesses(guesses, word):
    print("")
    for guess in guesses:
        for i in range(5):
            letter = guess[i]
            if letter == word[i]:
                print(Back.GREEN + Fore.BLACK + letter, end=" ")
            elif letter in word:
                print(Back.YELLOW + Fore.BLACK + letter, end=" ")
            else:
                print(letter, end=" ")
        print(Style.RESET_ALL)

def input_guess():
    while True:
        guess = input("\nEnter your guess:\n").strip().lower()
        if len(guess) != 5:
            print("Word must be exactly 5 letters")
            continue
        if valid(guess):
            return guess
        else:
            print("Not valid word")

def valid(word):
    try:
        response = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}")
        return response.status_code == 200
    except Exception as e:
        print("Error reaching dictionary API:", e)
        return False

def gen():
    if DEBUG:
        while True:
            user_word = input("Enter your secret 5-letter word:\n").strip().lower()
            if len(user_word) != 5:
                print("Word must be exactly 5 letters")
                continue
            if valid(user_word):
                print("Debug word accepted.")
                return user_word
            else:
                print("That word isn't valid. Try again.")
    else:
        try:
            response = requests.get("https://random-word-api.herokuapp.com/word?length=5")
            if response.status_code == 200:
                word = response.json()[0].lower()
                print("Random word selected!")
                return word
            else:
                print("Error fetching random word")
                exit(1)
        except Exception as e:
            print("Error reaching random word API:", e)
            exit(1)

if __name__ == '__main__':
    main()
