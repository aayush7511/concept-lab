# Your LLM project

Open Concept Lab, choose **LLMs From Scratch**, and use **Your LLM builds**.
Passed components are retained independently from the lesson editors.
The course covers the book's model-building path with Python knowledge assumed
and PyTorch introduced from zero.

1. Complete the relevant lessons, then attempt each component build.
2. Import dependencies from previously passed builds. The server supplies those
   exact passed module snapshots during grading.
3. Use **Download passed modules** to take your implementation into a local
   Python project. Install the course requirements in a virtual environment.
4. Keep CPU models tiny for learning. Use the exported workspace for longer
   training and real checkpoint files.

Build order: tokenizer → dataset → causal attention → GPT → trainer and sampler
→ classifier → instruction collator → LoRA. The pretrained mapper and training
schedule are additional builds available after their lessons.

The tests establish specific implementation behavior; tiny-data overfitting is
not evidence of useful language quality. The pretrained-mapping build tests
synthetic weights. Downloading a full GPT-2 checkpoint is a separate optional
step; no full model weights are downloaded by course setup.

The included course exercises are original. The book's own exercise solutions
remain in Appendix C and the author's repository; they are not reproduced or
claimed as completed by these course checks.
