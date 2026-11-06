# Neuroimaging Training

A training library and a private portal for supervised neuroimaging tasks.

## Student workflow

Students do not need a GitHub account, Git, or Quarto. The supervisor creates an account in the private portal and assigns an OpenNeuro subject and a Colab notebook. The student signs in, follows the private Google Drive setup guide, runs the notebook, checks the segmentation alignment, confirms the outputs are in the shared Drive folder, and marks the task complete in the portal.

The student portal uses Clerk for sign-in and Supabase for task assignments and completion status. Set <code>SUPABASE_URL</code> and <code>SUPABASE_SECRET_KEY</code> as server-side variables in the Vercel project. Never put the secret key in browser code or source control.

## Learning library

The public Quarto site contains brief references for the assigned one-scan workflow. The current Colab notebook uses OpenNeuro ds004144 and one assigned subject. Students should use the dataset and subject listed in their portal task.

A separate notebook for batch processing one or more datasets, and a notebook for making figures from batch outputs, are future work.

## Repository structure

- <code>datasets/</code>: brief notes about assigned input data.
- <code>techniques/</code>: segmentation and regional-volume explanations.
- <code>tutorials/</code>: notebook and question guidance.
- <code>projects/</code>: task handover notes.
- <code>templates/</code>: small handover template.
- <code>portal/</code>: private Next.js app for task assignment and progress.

The Quarto site is deployed to GitHub Pages from <code>main</code>. The portal is deployed separately on Vercel from the <code>portal/</code> directory.

## Maintainer workflow

Maintainers change the website, notebook, and portal source through Git branches and pull requests. Student task completion does not require a repository change. Quarto renders documentation only; it does not run the MRI analysis.

For a local preview, install Quarto and run <code>quarto preview</code>. The notebook is linked from Colab and has an output-free copy in <code>notebooks/First_regional_brain_volumes.ipynb</code>.

## Data and attribution

Do not commit raw imaging files, participant data, secrets, or restricted material. Analysis outputs remain in the supervisor-shared Drive folder. Check dataset terms and attribution before sharing results. Keep private Drive links out of public pages and repository discussions.
