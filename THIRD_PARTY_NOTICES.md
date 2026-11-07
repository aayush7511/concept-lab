# Third-party notices

`runtime/sync` contains the unmodified errgroup implementation from
`golang.org/x/sync` v0.10.0, copyright The Go Authors, under its BSD license.
The original license is retained in `runtime/sync/LICENSE`.
Source: https://go.googlesource.com/sync/+/refs/tags/v0.10.0

External teaching references are linked for further reading. Their content is
not included in the source distribution. Lessons provided with Concept Lab
are original examples, not copies of Codecademy or GeeksforGeeks courses.

ChatGPT access is provided by OpenAI under its own terms; the MIT license for
this application does not grant service access or modify subscription limits.

The LLMs From Scratch course is independently authored educational material
aligned to Sebastian Raschka's *Build a Large Language Model (From Scratch)*
(Manning). Book text and supplied PDFs are not included in application releases.
The reference repository is https://github.com/rasbt/LLMs-from-scratch .
The course is not affiliated with or endorsed by the author or publisher.

PyTorch, NumPy, tiktoken, and Matplotlib are separately installed dependencies
with their own licenses; this source distribution does not bundle their wheels.
Tokenizer data is fetched during the explicit course-setup step and cached
locally, outside the release package.
