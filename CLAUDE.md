# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EE559 (CSCI 559) — Spring 2026, USC**
**Title:** Adaptive Fraud Detection with Dynamic Thresholding and Cost-Sensitive Learning
**Student:** Om Suresh Prajapati (USC ID: 1430823821)

Binary classification task: detect fraudulent credit card transactions using the Kaggle Credit Card Fraud Detection Dataset (284,807 samples, 30 features — 28 anonymized PCA features V1–V28, plus `Time` and `Amount`; ~0.17% fraud prevalence).

## Dataset

The dataset is `creditcard.csv.zip` in the project root. Extract before use:
```bash
unzip creditcard.csv.zip
```

## Environment Setup

Work is done in Python with Jupyter Notebooks. Install dependencies:
```bash
pip install numpy pandas matplotlib seaborn scikit-learn imbalanced-learn jupyter
```

Run notebooks:
```bash
jupyter notebook
# or
jupyter lab
```

## Project Architecture

The pipeline must follow this strict data discipline to avoid leakage:
1. **Split first** — train/validation/test split before any rebalancing or scaling
2. **Fit transformers on train only** — apply `StandardScaler` (required for Logistic Regression and SVM) fitted on training data, then transform val/test
3. **Resample train only** — SMOTE, random under/over-sampling applied only to the training split

### Models to implement and compare
- **Logistic Regression** (baseline) — with L1/L2 regularization
- **Random Forest** — captures nonlinear interactions, provides feature importances
- **SVM or Gradient Boosted Trees** — third model for comparison

### Key experimental angles (beyond standard accuracy)
- Class imbalance handling: `class_weight='balanced'`, SMOTE, random under/over-sampling
- Threshold tuning on the validation set (do not use fixed 0.5)
- Cost-sensitive evaluation: different business costs for FP vs. FN
- Primary metrics: Precision-Recall AUC and ROC-AUC (not raw accuracy — dataset is highly imbalanced)
- Secondary metrics: Precision, Recall, F1-score, Confusion Matrix

## Deadlines

| Deliverable | Date |
|---|---|
| Midway Progress Report | 04/13/2026 |
| Project Presentations (15-min Zoom recording) | 05/04/2026 |
| Final Report (≤6 pages, IEEE/ACM format) + Code | 05/04/2026 |

## Unrelated Subdirectory

`office-chores/` is a separate full-stack TypeScript app (Express + React). It has its own `CLAUDE.md` and `SETUP.md`. It is not part of the ML course project.
