'use strict';

define('admin/manage/polls', ['api', 'alerts', 'bootstrap'], function (api, alerts, bootstrap) {
	const Polls = {};

	Polls.init = function () {
		// Initialize event handlers
		Polls.initCreatePoll();
		Polls.initPollOptions();
		Polls.loadPolls();
	};

	Polls.initCreatePoll = function () {
		const savePollBtn = document.getElementById('save-poll');
		const createPollForm = document.getElementById('create-poll-form');

		// Save poll button click handler
		savePollBtn.addEventListener('click', function () {
			if (createPollForm.checkValidity()) {
				Polls.createPoll();
			} else {
				createPollForm.reportValidity();
			}
		});
	};

	Polls.initPollOptions = function () {
		const addOptionBtn = document.getElementById('add-option');
		const optionsContainer = document.getElementById('poll-options-container');
		let optionCount = 2;

		// Add new poll option
		addOptionBtn.addEventListener('click', function () {
			optionCount++;
			const optionHtml = `
				<div class="poll-option-item d-flex gap-2 mb-2">
					<input type="text" class="form-control poll-option" placeholder="Option ${optionCount}" required>
					<button type="button" class="btn btn-outline-danger btn-sm remove-option">
						<i class="fa fa-times"></i>
					</button>
				</div>
			`;
			optionsContainer.insertAdjacentHTML('beforeend', optionHtml);
			Polls.updateRemoveButtons();
		});

		// Remove poll option
		optionsContainer.addEventListener('click', function (e) {
			if (e.target.classList.contains('remove-option') || e.target.parentElement.classList.contains('remove-option')) {
				const optionItem = e.target.closest('.poll-option-item');
				optionItem.remove();
				Polls.updateRemoveButtons();
			}
		});

		// Initialize remove button states
		Polls.updateRemoveButtons();
	};

	Polls.updateRemoveButtons = function () {
		const options = document.querySelectorAll('.poll-option-item');
		const removeButtons = document.querySelectorAll('.remove-option');
		
		removeButtons.forEach(btn => {
			btn.disabled = options.length <= 2;
		});
	};

	Polls.createPoll = function () {
		// Get poll data from form
		const title = document.getElementById('poll-title').value;
		const description = document.getElementById('poll-description').value;
		const optionInputs = document.querySelectorAll('.poll-option');
		const options = Array.from(optionInputs).map(input => input.value);
		
		// Create poll object with required fields according to API
		const pollData = {
			title: title,
			settings: {
				description: description,
				// Only include settings that are supported by the API
				// We don't create new endpoints, so only include what the API supports
			},
		};

		// Call API to create poll
		console.log('Sending API request to create poll:', pollData);
		api.post('/api/polls', pollData)
			.then((response) => {
				// Handle successful poll creation
				console.log('API response:', response);
				// The API response might be wrapped in a response object or directly contain poll_id
				const pollId = response && (
					(response.response && (response.response.pollId || response.response.poll_id)) ||
					(response.pollId || response.poll_id)
				);
				
				if (pollId) {
					console.log('Poll created with ID:', pollId);
					// Add options to the poll
					Polls.addPollOptions(pollId, options);
				} else {
					console.error('Invalid API response:', response);
					alerts.error('Error creating poll: Invalid response format');
				}
			})
			.catch((err) => {
				console.error('API error:', err);
				alerts.error('Error creating poll: ' + (err.message || 'Unknown error'));
			});
	};

	Polls.addPollOptions = function (pollId, options) {
		// Create a chain of promises to add options sequentially
		let optionPromises = Promise.resolve();
		
		options.forEach((optionText, index) => {
			optionPromises = optionPromises
				.then(() => {
					console.log(`Adding option "${optionText}" to poll ${pollId}`);
					return api.post(`/api/polls/${pollId}/options`, {
						text: optionText,
						sort: index,
					});
				})
				.then(response => {
					console.log('Option added response:', response);
					return Promise.resolve();
				})
				.catch(err => {
					console.error('Error adding poll option:', err);
					// Continue with other options even if one fails
					return Promise.resolve();
				});
		});

		// After all options are added
		optionPromises
			.then(() => {
				alerts.success('Poll created successfully');
				// Close modal
				const modal = bootstrap.Modal.getInstance(document.getElementById('create-poll-modal'));
				modal.hide();
				// Reset form
				Polls.resetForm();
				// Reload polls list
				Polls.loadPolls();
			})
			.catch((err) => {
				console.error('Final error adding options:', err);
				alerts.error('Error adding poll options: ' + (err.message || 'Unknown error'));
			});
	};

	Polls.resetForm = function () {
		// Reset form fields
		document.getElementById('poll-title').value = '';
		document.getElementById('poll-description').value = '';
		
		// Reset poll options to default two options
		const optionsContainer = document.getElementById('poll-options-container');
		optionsContainer.innerHTML = `
			<div class="poll-option-item d-flex gap-2 mb-2">
				<input type="text" class="form-control poll-option" placeholder="Option 1" required>
				<button type="button" class="btn btn-outline-danger btn-sm remove-option" disabled>
					<i class="fa fa-times"></i>
				</button>
			</div>
			<div class="poll-option-item d-flex gap-2 mb-2">
				<input type="text" class="form-control poll-option" placeholder="Option 2" required>
				<button type="button" class="btn btn-outline-danger btn-sm remove-option" disabled>
					<i class="fa fa-times"></i>
				</button>
			</div>
		`;
	};
	
	Polls.loadPolls = function () {
		// Fetch polls from API
		api.get('/api/polls')
			.then((response) => {
				console.log('Polls loaded:', response);
				if (response && response.polls && response.polls.length > 0) {
					Polls.renderPolls(response.polls);
				} else {
					// No polls found, show empty state
					console.log('No polls found');
				}
			})
			.catch((err) => {
				console.error('Error loading polls:', err);
				alerts.error('Error loading polls: ' + (err.message || 'Unknown error'));
			});
	};
	
	Polls.renderPolls = function (polls) {
		const pollsList = document.querySelector('.polls-list');
		if (!pollsList) return;
		
		// Clear existing content
		pollsList.innerHTML = '';
		
		// Create table for polls
		const table = document.createElement('table');
		table.className = 'table';
		table.innerHTML = `
			<thead>
				<tr>
					<th>ID</th>
					<th>Title</th>
					<th>Created</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
			</tbody>
		`;
		
		const tbody = table.querySelector('tbody');
		
		// Add polls to table
		polls.forEach(poll => {
			const tr = document.createElement('tr');
			const createdDate = new Date(poll.created);
			
			tr.innerHTML = `
				<td>${poll.id}</td>
				<td>${poll.title}</td>
				<td>${createdDate.toLocaleString()}</td>
				<td>
					<button class="btn btn-sm btn-primary view-poll" data-poll-id="${poll.id}">
						<i class="fa fa-eye"></i> View
					</button>
				</td>
			`;
			
			tbody.appendChild(tr);
		});
		
		pollsList.appendChild(table);
		
		// Update stats
		const totalPollsEl = document.querySelector('.badge.bg-primary');
		if (totalPollsEl) {
			totalPollsEl.textContent = polls.length;
		}
	};

	return Polls;
});
