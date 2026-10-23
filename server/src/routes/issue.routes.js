const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const c = require('../controllers/issue.controller');

router.use(protect);

/* Raising a problem, and seeing what happened to the ones you raised, are
 * open to every signed-in user on purpose: the people who hit problems most
 * are the ones with the narrowest permissions, and a report that has to go
 * through somebody else does not get made. */
router.post('/', c.createIssue);
router.get('/mine', c.getMyIssues);

// The queue and the answers are the team's.
router.get('/', authorize('Super Admin', 'Admin'), c.getIssues);
router.get('/open-count', authorize('Super Admin', 'Admin'), c.getOpenIssueCount);
router.put('/:id', authorize('Super Admin', 'Admin'), c.updateIssue);

module.exports = router;
