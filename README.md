<p align="center">
  <img src="assets/cover.png" width="600" />
</p>

<h1 align="center">DrawDash</h1>

<p align="center">
  <b>Proactive Agentic Whiteboards: Enhancing Diagrammatic Learning</b>
</p>

<p align="center">
  An AI-powered whiteboard assistant that proactively completes and refines educational diagrams through multimodal understanding. DrawDash listens to spoken explanations, detects intent, and dynamically suggests diagram refinements that can be accepted with a single keystroke.
</p>

<p align="center">
  <a href="https://arxiv.org/abs/2512.01234v2">Paper</a> · <a href="#overview">Overview</a> · <a href="#setup">Setup</a> · <a href="https://x.com/SuveenE/status/1979942916572561527?s=20">Demo</a>
</p>

<p align="center">
  <a href="https://arxiv.org/abs/2512.01234v2"><img src="https://img.shields.io/badge/arXiv-2512.01234-b31b1b.svg" alt="arXiv" /></a>
  <img src="https://img.shields.io/github/license/foloup/foloup" alt="License" />
  <a href="https://x.com/SuveenE/status/1979942916572561527?s=20"><img src="https://img.shields.io/badge/demo-drawdash-blue" alt="Demo" /></a>
</p>

---

Educators frequently rely on diagrams to explain complex concepts during lectures, yet creating clear and complete visual representations in real time while simultaneously speaking can be cognitively demanding. DrawDash adopts a TAB-completion interaction model: it listens to spoken explanations, detects intent, and dynamically suggests refinements that can be accepted with a single keystroke.

## Overview

| Component | Description |
|-----------|-------------|
| **Speech Recognition** | Listens to spoken explanations while you draw |
| **Visual Understanding** | Interprets incomplete diagrams in real time |
| **Generative AI** | Suggests improved and completed diagrams |
| **TAB Completion** | Accept suggestions with a single keystroke |

## Why DrawDash?

| Challenge | How DrawDash Helps |
|-----------|-------------|
| Cognitive Load | Reduces the burden of drawing and speaking simultaneously |
| Incomplete Diagrams | Proactively completes missing visual elements |
| Real-Time Feedback | Provides instant suggestions based on speech context |
| Diagram Quality | Refines rough sketches into clear educational visuals |

## Paper

**Title:** Proactive Agentic Whiteboards: Enhancing Diagrammatic Learning

**Authors:** Suveen Ellawela, Sashenka Gamage, Dinithi Dissanayake

**Link:** [https://arxiv.org/html/2512.01234v2](https://arxiv.org/html/2512.01234v2)

### Abstract

Educators frequently rely on diagrams to explain complex concepts during lectures, yet creating clear and complete visual representations in real time while simultaneously speaking can be cognitively demanding. Incomplete or unclear diagrams may hinder student comprehension, as learners must mentally reconstruct missing information while following the verbal explanation. Inspired by advances in code completion tools, we introduce DrawDash, an AI-powered whiteboard assistant that proactively completes and refines educational diagrams through multimodal understanding. DrawDash adopts a TAB-completion interaction model: it listens to spoken explanations, detects intent, and dynamically suggests refinements that can be accepted with a single keystroke. We demonstrate DrawDash across four diverse teaching scenarios—spanning topics from computer science and web development to biology. This work represents an early exploration into reducing instructors' cognitive load and improving diagram-based pedagogy through real-time, speech-driven visual assistance, and concludes with a discussion of current limitations and directions for formal classroom evaluation.

## Setup

DrawDash consists of two main components: a backend API and a frontend web application.

```bash
# Clone the repository
git clone https://github.com/foloup/drawdash.git
cd drawdash
```

| Component | Instructions |
|-----------|-------------|
| **Backend** | See [backend/README.md](backend/README.md) |
| **Frontend** | See [frontend/README.md](frontend/README.md) |

## Citation

If you use this work in your research, please cite:

```bibtex
@misc{ellawela2025drawdash,
      title={Proactive Agentic Whiteboards: Enhancing Diagrammatic Learning},
      author={Suveen Ellawela and Sashenka Gamage and Dinithi Dissanayake},
      year={2025},
      eprint={2512.01234},
      archivePrefix={arXiv},
      primaryClass={cs.HC},
      url={https://arxiv.org/abs/2512.01234v2},
}
```

## Contact

If you have any questions or feedback, please feel free to reach out at [suveen.te1[at]gmail.com](mailto:suveen.te1@gmail.com).

## License

The software code is licensed under the MIT License.
