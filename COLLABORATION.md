# Remote development

Repository: https://github.com/risheekaiyar/ride-ledger (private).

No invitation has been sent to VarunAiyar. The owner must separately authorize repository access before another account can clone this private source. A paid AI subscription does not grant repository access.

After access is granted, each developer should authenticate GitHub on their own machine, clone the repository, open it in Android Studio or their own coding tool, and work on a feature branch. Submit changes through a pull request so the owner can review them. Do not exchange passwords, API keys or signing keys.

Build with JDK 17, Android SDK 35, and the included wrapper:

```powershell
.\gradlew.bat assembleDebug lintDebug testDebugUnitTest
```

On Linux/macOS:

```sh
bash ./gradlew assembleDebug lintDebug testDebugUnitTest
```

The GitHub Actions workflow runs these checks on pushes and pull requests and uploads the resulting debug APK as a workflow artifact. The first cloud run is separate from the already verified local build; inspect the Actions tab for its actual outcome.

Before editing, read README.md, BUILD-STATUS.md and PHONE-TEST.md. The next milestone is a successful locked-screen walk on the Vivo X300 Pro. BRIEF-REVIEW.md contains candidate product ideas, not an instruction to implement a social network or unvalidated sensor scores.

Never commit route exports, credentials, caches, local tool downloads or signing material. Debug APKs built on different machines may use different signing keys: export rides before uninstalling or clearing app storage. Confirm competition team eligibility before using another person's contributions in an entry.

The original local checkout was published through the connected GitHub app because command-line Git is not authenticated. Do not assume its local branch has the remote commit history. After setting up Git authentication, reconcile the local branch with origin/main before pushing; do not overwrite remote history.
