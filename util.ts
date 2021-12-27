export function comap<T>(it: Iterable<void>, cb: () => T | T[]) {
	const output = [];
	for (const _ of it) {
		const result = cb();
		if (Array.isArray(result)) output.push(...result);
		else output.push(result);
	}
	return output;
}

export function* zip<T, U>(it1: Iterable<T>, it2: Iterable<U>) {
	const iterator1 = it1[Symbol.iterator]();
	const iterator2 = it2[Symbol.iterator]();
	while (true) {
		const { done: done1, value: value1 } = iterator1.next();
		const { done: done2, value: value2 } = iterator2.next();
		if (done1 && done2) break;
		yield [value1, value2]
	}
}
