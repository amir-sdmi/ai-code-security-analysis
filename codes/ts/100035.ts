// Disclaimer: This code was written by ChatGPT (with minimal editing) and may not necessarily be the best solution for the problem.

const removeString = (a: string, b: string): string => {
	// Check if `a` is a substring of `b`
	if (b.includes(a)) {
		// If it is, use the replace method to remove it
		return b.replace(a, "");
	} else {
		// If it's not, just return the original string
		return b;
	}
};

export default removeString;
