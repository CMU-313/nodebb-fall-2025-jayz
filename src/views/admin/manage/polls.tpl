<div class="polls d-flex flex-column gap-2 px-lg-4">

	<div class="d-flex border-bottom py-2 m-0 sticky-top acp-page-main-header align-items-center justify-content-between flex-wrap gap-2">
		<div class="">
			<h4 class="fw-bold tracking-tight mb-0">[[admin/manage/polls:manage-polls]]</h4>
			<p class="mb-0 text-sm text-secondary">[[admin/manage/polls:description]]</p>
		</div>
		<div class="d-flex align-items-center gap-1 flex-wrap">
			<div class="input-group flex-nowrap w-auto">
				<input class="form-control form-control-sm w-auto" type="text" id="poll-search" placeholder="[[admin/manage/polls:search]]"/>
				<span class="input-group-text"><i class="fa fa-search"></i></span>
			</div>

			<button class="btn btn-light btn-sm text-nowrap" id="deleteSelected"><i class="fa fa-trash text-danger"></i> [[admin/manage/polls:delete-selected]]</button>
			<button class="btn btn-primary btn-sm text-nowrap" id="createPoll" data-bs-toggle="modal" data-bs-target="#create-poll-modal">
				<i class="fa fa-plus"></i> [[admin/manage/polls:create-poll]]
			</button>
		</div>
	</div>

	<div class="polls-content">
		<div class="row">
			<!-- Existing Polls List -->
			<div class="col-12 col-lg-8">
				<div class="card">
					<div class="card-header">
						<h5 class="card-title mb-0">[[admin/manage/polls:existing-polls]]</h5>
					</div>
					<div class="card-body">
						<div class="alert alert-info text-sm">
							<i class="fa fa-info-circle"></i> [[admin/manage/polls:existing-description]]
						</div>
						
						<div class="polls-list">
							<!-- This would be populated with existing polls in a real implementation -->
							<div class="text-center py-4 text-muted">
								<i class="fa fa-poll-h fa-2x mb-2"></i>
								<p>[[admin/manage/polls:no-polls]]</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Stats -->
			<div class="col-12 col-lg-4">
				<div class="card">
					<div class="card-header">
						<h5 class="card-title mb-0">[[admin/manage/polls:statistics]]</h5>
					</div>
					<div class="card-body">
						<div class="d-flex flex-column gap-3">
							<div class="d-flex justify-content-between">
								<span>[[admin/manage/polls:total-polls]]</span>
								<span class="badge bg-primary">0</span>
							</div>
							<div class="d-flex justify-content-between">
								<span>[[admin/manage/polls:active-polls]]</span>
								<span class="badge bg-success">0</span>
							</div>
							<div class="d-flex justify-content-between">
								<span>[[admin/manage/polls:closed-polls]]</span>
								<span class="badge bg-secondary">0</span>
							</div>
							<div class="d-flex justify-content-between">
								<span>[[admin/manage/polls:total-votes]]</span>
								<span class="badge bg-info">0</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Create Poll Modal -->
	<div class="modal fade" id="create-poll-modal" tabindex="-1" aria-labelledby="create-poll-modal-label" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="create-poll-modal-label">[[admin/manage/polls:create-poll]]</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<form id="create-poll-form">
						<!-- Poll Title -->
						<div class="mb-3">
							<label for="poll-title" class="form-label">[[admin/manage/polls:poll-title]] <span class="text-danger">*</span></label>
							<input type="text" class="form-control" id="poll-title" placeholder="[[admin/manage/polls:poll-title-placeholder]]" required>
							<div class="form-text">[[admin/manage/polls:poll-title-help]]</div>
						</div>

						<!-- Poll Description -->
						<div class="mb-3">
							<label for="poll-description" class="form-label">[[admin/manage/polls:poll-description]]</label>
							<textarea class="form-control" id="poll-description" rows="3" placeholder="[[admin/manage/polls:poll-description-placeholder]]"></textarea>
							<div class="form-text">[[admin/manage/polls:poll-description-help]]</div>
						</div>

						<!-- Poll Options -->
						<div class="mb-3">
							<label class="form-label">[[admin/manage/polls:poll-options]] <span class="text-danger">*</span></label>
							<div id="poll-options-container">
								<div class="poll-option-item d-flex gap-2 mb-2">
									<input type="text" class="form-control poll-option" placeholder="[[admin/manage/polls:option-placeholder]] 1" required>
									<button type="button" class="btn btn-outline-danger btn-sm remove-option" disabled>
										<i class="fa fa-times"></i>
									</button>
								</div>
								<div class="poll-option-item d-flex gap-2 mb-2">
									<input type="text" class="form-control poll-option" placeholder="[[admin/manage/polls:option-placeholder]] 2" required>
									<button type="button" class="btn btn-outline-danger btn-sm remove-option" disabled>
										<i class="fa fa-times"></i>
									</button>
								</div>
							</div>
							<button type="button" class="btn btn-outline-primary btn-sm" id="add-option">
								<i class="fa fa-plus"></i> [[admin/manage/polls:add-option]]
							</button>
							<div class="form-text">[[admin/manage/polls:poll-options-help]]</div>
						</div>

						<!-- Poll Settings -->
						<div class="row">
							<div class="col-md-6">
								<div class="mb-3">
									<label for="poll-category" class="form-label">[[admin/manage/polls:poll-category]]</label>
									<select class="form-select" id="poll-category">
										<option value="">[[admin/manage/polls:select-category]]</option>
										<option value="general">[[admin/manage/polls:category-general]]</option>
										<option value="announcements">[[admin/manage/polls:category-announcements]]</option>
										<option value="feedback">[[admin/manage/polls:category-feedback]]</option>
									</select>
								</div>
							</div>
							<div class="col-md-6">
								<div class="mb-3">
									<label for="poll-visibility" class="form-label">[[admin/manage/polls:poll-visibility]]</label>
									<select class="form-select" id="poll-visibility">
										<option value="public">[[admin/manage/polls:visibility-public]]</option>
										<option value="members">[[admin/manage/polls:visibility-members]]</option>
										<option value="groups">[[admin/manage/polls:visibility-groups]]</option>
									</select>
								</div>
							</div>
						</div>

						<!-- Advanced Settings -->
						<div class="mb-3">
							<div class="form-check">
								<input class="form-check-input" type="checkbox" id="allow-multiple-votes">
								<label class="form-check-label" for="allow-multiple-votes">
									[[admin/manage/polls:allow-multiple-votes]]
								</label>
							</div>
							<div class="form-check">
								<input class="form-check-input" type="checkbox" id="show-results-before-voting">
								<label class="form-check-label" for="show-results-before-voting">
									[[admin/manage/polls:show-results-before-voting]]
								</label>
							</div>
							<div class="form-check">
								<input class="form-check-input" type="checkbox" id="anonymous-voting">
								<label class="form-check-label" for="anonymous-voting">
									[[admin/manage/polls:anonymous-voting]]
								</label>
							</div>
						</div>

						<!-- Poll Duration -->
						<div class="mb-3">
							<label class="form-label">[[admin/manage/polls:poll-duration]]</label>
							<div class="row">
								<div class="col-md-6">
									<input type="datetime-local" class="form-control" id="poll-start-date">
									<div class="form-text">[[admin/manage/polls:start-date-help]]</div>
								</div>
								<div class="col-md-6">
									<input type="datetime-local" class="form-control" id="poll-end-date">
									<div class="form-text">[[admin/manage/polls:end-date-help]]</div>
								</div>
							</div>
						</div>
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">[[admin/manage/polls:cancel]]</button>
					<button type="button" class="btn btn-primary" id="save-poll">
						<i class="fa fa-save"></i> [[admin/manage/polls:create-poll]]
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<script>
require(['admin/manage/polls'], function (polls) {
	polls.init();
});
</script>
