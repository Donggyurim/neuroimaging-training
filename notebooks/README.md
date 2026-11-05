# Course notebooks

`First_regional_brain_volumes.ipynb` began as a notebook uploaded by the supervisor under that filename. Its title is “My first regional brain volumes”. The upload contains no author or source-history metadata identifying its original creator; do not infer authorship from the upload.

Original upload SHA-256:
`bec0296f8be7d7bdf703a4b629e2032a2c919476bb2ee36030a8c98198340a5d`

Saved outputs, widget state, execution counts, and runtime cell metadata are removed. The notebook retains the FastSurfer analysis approach and volume calculations, with a new task wrapper for the assigned subject and supervisor-shared output folder.

The first pilot is pinned to the ds004144 dataset commit
`b6e525adf7b861d5dab7e539bff19f90ce482032`. It accepts a task ID, subject ID, and the exact name of the shared-folder shortcut in the student's My Drive. The scan is downloaded to Colab's temporary workspace and checked against its DataLad annex key. Results are written to
`results/<task-id>/<subject-id>/<run-id>` in the shared folder. The website copies the notebook as a downloadable resource and never executes it.

The supervisor reports a successful mock-student Colab run for ds004144 sub-002, with outputs saved to the shared folder. This verifies Drive authorization and the output path for that account and subject. It does not certify image QC or the scientific method; review the saved outputs before scaling up. The notebook checks each assigned subject against the pinned snapshot. Hard-label regional volumes are distinct from cortical thickness, partial-volume-corrected statistics, and head-size-normalised measures.

Read `tutorials/first-regional-brain-volumes.qmd` for the student workflow, expected outputs, and review checkpoints.
