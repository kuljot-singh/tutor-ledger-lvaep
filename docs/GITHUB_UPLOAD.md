# Publish the submission source on GitHub

Direct GitHub publishing was not available in this session. The source ZIP is a clean snapshot, not a live database backup. It contains application source, migrations, tests and documentation; no dependencies, build output, database files or credentials.

1. Download and unzip `tutor-ledger-lvaep.zip`.
2. Sign in to GitHub and open https://github.com/new.
3. Name it **tutor-ledger-lvaep**, select **Public**, and create it. Leave the initial README option unchecked because this package has one.
4. Select **uploading an existing file**. Open the extracted `tutor-ledger-lvaep` folder and upload its **contents**, not the ZIP or enclosing folder. Include `.gitignore`, `.npmrc`, and `.openai/hosting.json` (enable “show hidden files” in your file picker if needed).
5. Commit the upload. Open the repository link in a signed-out/private window and verify README, `app/`, `drizzle/`, `tests/`, and `.gitignore` are present.
6. Paste that public repository URL into the CSS submission form. The live app URL is separate and already deployed.

The hosting project identity is removed from the export, while its logical `DB` binding remains. Uploading code does not create a second deployment; the existing live URL remains the demo. A different host needs its own D1 database binding.
