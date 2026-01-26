import Input, { input } from "./Input.astro";
import SearchInput, { searchInput, searchInputWrapper, searchInputIcon } from "./SearchInput.astro";
import InputError, { inputError } from "./InputError.astro";

const InputVariants = { input, searchInput, searchInputWrapper, searchInputIcon, inputError };

export { Input, InputVariants, SearchInput, InputError };

export default Input;
