#!/bin/bash
# Run codex review on the last commit
cd /home/sam/dev/ridger.ch
exec /home/sam/.local/bin/codex review --commit HEAD - < /home/sam/dev/ridger.ch/scripts/codex-review-prompt.txt
