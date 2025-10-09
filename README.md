# Task Prioritization Tool

## 1.1 Overview

This project aims to create a task prioritization tool. Its purpose is to illustrate, to the user, which current tasks deserve prioritizing. The intended user could include anyone, but we believe it would be especially useful for Five College students since university students commonly have a large diversity of tasks at any time.

The relevant problem facing our future users is a difficulty in knowing which task to prioritize. A single person can be tasked with a variety of deliverables that range in importance levels, time until due, and fraction completed. Some tasks are important while not urgent, while other tasks are urgent while being relatively unimportant. Our system cuts through that confusion by recording and organizing their tasks in such a way that the task priority is optimal.

**Stakeholders** include the development team (Priority Flow) as well as the users. If we assume we are growing this as a startup and taking this to market, then the stakeholders could also include a human factors consultant and the ADA Access Group for accessibility.



## 1.2 Features

Some of the main features of the project:

- **Fast CRUD** with instant re-ranking of tasks added or deleted, based on the following strategies:
  - **Earliest Due Date (EDD):** Tackle tasks with sooner deadlines.
  - **Shortest Processing Time (SPT):** Surface tasks that can be finished quickly.
  - **Weighted Shortest Processing Time (WSPT):** Maximize value by importance ÷ estimated time.
- **Filtering options** such as **Date Range** and **Type of Priority**.
- **GUI interactions** that let users add, edit, or delete tasks.
- **Persistent storage** so the list of tasks remains saved between sessions.
- **Analytics visualizations** including:
  - **On-time completion rate** of tasks (interactive to motivate users).
  - **Cumulative Flow Diagram (CFD)** showing stacked areas of **Backlog**, **In-Progress**, and **Done** tasks.