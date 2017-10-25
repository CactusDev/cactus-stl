
/**
* Capitalize the first character of a string.
* hi -> Hi
*/
export function title(original: string) {
	return original.substring(0, 1).toUpperCase() + original.substring(1);
}
