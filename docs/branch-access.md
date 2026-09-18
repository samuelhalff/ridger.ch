# Accessing the `fix/i18n-http-backend` branch

The i18n runtime backend work lives on the `fix/i18n-http-backend` branch. The branch currently exists only in the local repository clone because no Git remote is configured in this environment.

To publish it so others can fetch it:

1. Add your remote if it is missing:
   ```bash
   git remote add origin git@github.com:YOUR_ORG/ark-fid.ch.git
   ```
2. Push the branch upstream:
   ```bash
   git push -u origin fix/i18n-http-backend
   ```

After pushing, teammates can run `git fetch origin fix/i18n-http-backend` and `git checkout fix/i18n-http-backend` to inspect the changes locally.
