# How to Push Your Code

You are almost there! 

1. **Typo Fix**: You typed `it push` instead of `git push`.
2. **Subdirectory**: I removed the empty `event-planner-v1` folder you accidentally cloned. Your code is safely in the main folder.
3. **Remote Setup**: Your remote `origin` is correctly set to `https://ayphen-admin@bitbucket.org/ayphen/event-planner-v1.git`.

### The Command You Need to Run

Run this command in your terminal:

```bash
git push -u origin main --force
```

### Why `--force`?
Because the Bitbucket repository is not empty (it likely has a default README or .gitignore), Git will refuse to overwrite it by default. Since this is a new project and you want your local code to be the source of truth, `--force` tells Git to overwrite the remote repository with your code.

### If it asks for a Password
Enter your Bitbucket password. 
*Note: If you have 2FA enabled, you must use an App Password instead of your regular account password.*
