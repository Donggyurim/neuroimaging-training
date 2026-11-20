# Course notebooks

The output-free publication copy, <code>First_regional_brain_volumes.ipynb</code>, began as a notebook uploaded by the supervisor under that filename. Its title is “My first regional brain volumes”. The upload does not identify its original creator; do not infer authorship from the upload.

Original upload SHA-256:
<code>bec0296f8be7d7bdf703a4b629e2032a2c919476bb2ee36030a8c98198340a5d</code>

Saved outputs, widget state, execution counts, and runtime cell metadata are removed. The notebook keeps the FastSurfer analysis approach and volume calculations, with a task wrapper for the assigned subject and supervisor-shared Drive folder. It is pinned to OpenNeuro ds004144 commit <code>b6e525adf7b861d5dab7e539bff19f90ce482032</code>.

The notebook accepts a task ID, subject ID, and the exact name of the shared-folder shortcut in My Drive. It downloads the assigned scan into Colab’s temporary workspace, checks the file against the dataset record, and saves results to <code>results/&lt;task-id&gt;/&lt;subject-id&gt;/&lt;run-id&gt;</code> in the shared folder.

The supervisor reports a successful mock-student Colab run for ds004144 sub-002, with outputs saved to the shared folder. This confirms Drive access and output saving for that tested account and subject. It does not establish image QC or scientific validity; check the saved alignment before expanding the workflow.

Students open the notebook from their assigned task and run it in Google Colab. They do not need Git, Quarto, or a GitHub account.
