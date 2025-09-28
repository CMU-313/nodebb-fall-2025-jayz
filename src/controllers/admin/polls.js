'use strict';

const pollsController = module.exports;

pollsController.get = async function (req, res) {
	// Render the poll creation admin page
	res.render('admin/manage/polls', {
		title: 'Poll Management',
		breadcrumbs: [
			{ text: 'Admin', url: '/admin' },
			{ text: 'Manage', url: '/admin/manage' },
			{ text: 'Polls' },
		],
	});
};
