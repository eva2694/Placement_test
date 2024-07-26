from itertools import cycle

# Item list
strings = ['apple', 'banana', 'cherry', 'date']
delimiters = ['-', '+', '=']

# Create the cycle
delim_cycle = cycle(delimiters)

# Concatenate strings 
result = ''.join(f"{string}{next(delim_cycle)}" for string in strings)

# Remove the last delimiter
result = result[:-1]  # This removes the last delimiter added

print(result)  # Output: 'apple-banana+cherry=date'