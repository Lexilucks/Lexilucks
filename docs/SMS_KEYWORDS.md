# Lexi Concierge SMS Keywords

Reference table for all handled inbound SMS keywords.

| Intent | Keywords | Action |
|--------|----------|--------|
| `MENU` | ACCESS, MENU, OPTIONS | Shows the main package menu. |
| `PACKAGE_SELECT` | 1, 2, 3, 4, 5, 6, 7, 8 | Selects a package (only valid after menu is sent). |
| `STOP` | STOP, UNSUBSCRIBE, CANCEL, END, QUIT | Opts the user out of all future messages immediately. |
| `HELP` | HELP, INFO, SUPPORT | Shows the help menu with instructions. |
| `STATUS` | STATUS, CHECK | Returns the current state of the fan's request. |
| `RESCHEDULE` | RESCHEDULE, CHANGE | Provides the scheduling link again (if applicable). |
