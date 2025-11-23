#!/usr/bin/env python

message = 'CRYPTOGRAPHYISCOOL'

k = 3

alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

def to_int(c):
	return alphabet.find(c)
	
def shift(m, key, mode):
	res = ''
	for a in m:
		res = res + alphabet[(to_int(a) + mode*key) % len(alphabet)]
	return res
	
print( shift(message, k, 1) + "\n")

ciphertext = shift(message, k,1)

for i in range(len(alphabet)):
	print( shift(ciphertext,i,-1))

 
	 
