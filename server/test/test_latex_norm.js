
function normalizeMarkdown(text) {
    if (!text) return ''
    // 1. Replace literal "\n" with newline (common in JSON responses)
    let normalized = text.replace(/\\n/g, '\n')

    // 2. Fix \\t -> \t
    normalized = normalized.replace(/\\t/g, '\t')

    // 3. Convert \[ ... \] to $$ ... $$
    // We need to match \[ that is NOT preceded by a backslash (to avoid matching \\[ if that was intended as line break in latex, wait. 
    // In LaTeX, \\[ is a line break. \[ is start of display math.
    // If the string is "x \\[ y", it means x, line break, y.
    // If the string is "\[ x \]", it means display math x.
    // Regex for \[ is /\\\[/ ? No.
    // In JS string: "\\[" represents `\[`.
    // In Regex: /\\\[/ matches `\[`.
    // So if we have `\\[` (line break), it is literally `\` followed by `[`.
    // `\[` (display math) is also `\` followed by `[`.
    // Ah, in LaTeX source:
    // Display math: \[ x^2 \]
    // Line break: x \\ y (usually inside an environment) or \\[3pt]
    // Wait, `\\[` IS the line break command.
    // `\[` is display math.
    // They are literally the same character sequence: backslash + bracket.
    // How does LaTeX distinguish?
    // `\[` is usually used in text mode to start math.
    // `\\[` is used inside math mode (like array/align) to end a line.
    
    // If we blindly replace `\[` with `$$`, we break `\\[` inside arrays.
    // However, `remark-math` / `katex` might not support `\[`...`\]` delimiters by default?
    // Actually, `rehype-katex` usually renders math that `remark-math` identified.
    // `remark-math` only identifies `$..$` and `$$..$$`.
    // So we MUST convert `\[..\]` to `$$..$$` for `remark-math` to see it.
    
    // But we must NOT convert `\\[` inside an existing math block.
    // This implies we need to be careful.
    
    // Heuristic: `\[` usually appears at the start of a line or after text.
    // `\\[` usually appears after some math content.
    // Also `\[` is followed by math content. `\\[` might be followed by optional arg `[3pt]`.
    
    // Maybe we only replace `\[` if it's "top level"?
    // Or maybe we can rely on the fact that `remark-math` parses `$` blocks first?
    // No, we are preprocessing the string BEFORE `remark-math`.
    
    // Let's assume the AI outputs `\[ ... \]` for display math.
    // And `\( ... \)` for inline math.
    // We can replace `\( ... \)` with `$ ... $`.
    // We can replace `\[ ... \]` with `$$ ... $$`.
    
    // What if the AI outputs `\\[` for newline?
    // e.g. `\begin{bmatrix} a & b \\ c & d \end{bmatrix}`.
    // Here `\\` is double backslash.
    // If we have `\begin{bmatrix} a & b \\[10pt] c & d \end{bmatrix}`.
    // Then `\\[` matches our pattern for `\[`.
    
    // Refined Regex:
    // Match `\[` that is NOT preceded by `\`.
    // i.e. `(?<!\\)\\\[`.
    // Wait, `\` is `\\` in regex string.
    // So `(?<!\\)\\\[`.
    
    // Test cases:
    // "\[ x \]" -> "$$ x $$"
    // "x \\[ y" -> "x \\[ y" (no change)
    
    // Note: JS supports lookbehind in recent versions (Node 18+ should be fine).
    // Trae environment is Node?
    // Let's verify environment. It says "shell_type: node".
    
    try {
        normalized = normalized.replace(/(?<!\\)\\\[/g, '$$$$') // $$
        normalized = normalized.replace(/(?<!\\)\\\]/g, '$$$$') // $$
        normalized = normalized.replace(/(?<!\\)\\\(/g, '$')
        normalized = normalized.replace(/(?<!\\)\\\)/g, '$')
    } catch (e) {
        console.error("Regex error (lookbehind not supported?):", e)
        // Fallback or simpler regex if needed
    }

    return normalized
}

// Tests
const tests = [
    { in: "Hello \\n World", out: "Hello \n World" },
    { in: "Math \\[ x^2 \\]", out: "Math $$ x^2 $$" },
    { in: "Inline \\( x \\)", out: "Inline $ x $" },
    { in: "Array: \n$$ \\begin{matrix} a & b \\\\ c & d \\end{matrix} $$", out: "Array: \n$$ \\begin{matrix} a & b \\\\ c & d \\end{matrix} $$" }, // No change expected ideally, but wait.
    // The regex `(?<!\\)\\\[` checks for `\[` not preceded by `\`.
    // In `\\\\`, the first `\` escapes the second. The third char is not `[`.
    // Wait, `\\\\` is `\\`.
    // If input string is `... \\ ...`, there is no `\[`.
    // If input is `... \\[ ...`, i.e. `\` `\` `[` ...
    // The `[` is preceded by `\`. So `(?<!\\)` should prevent match.
    // Let's test carefully.
    { in: "Line break \\\\[", out: "Line break \\\\[" }, // Should not change
]

tests.forEach((t, i) => {
    const res = normalizeMarkdown(t.in)
    if (res !== t.out) {
        console.log(`Test ${i} failed.\nIn: ${JSON.stringify(t.in)}\nOut: ${JSON.stringify(res)}\nExp: ${JSON.stringify(t.out)}`)
    } else {
        console.log(`Test ${i} passed`)
    }
})
