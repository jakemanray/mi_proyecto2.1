var models = require('../models/models.js');

// MW que permite acciones solamente si el quiz objeto
// pertenece al usuario logeado o si es cuenta admin

exports.ownershipRequired = function(req,res,next){
	var objQuizOwner = req.quiz.UserId;
	var logUser = req.session.user.id;
	var isAdmin = req.session.user.isAdmin;

	if (isAdmin || objQuizOwner === logUser){
		next();
	} else {
		res.redirect('/');
	}
};

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function(req, res, next, quizId){
	models.Quiz.find({
			  where: { id: Number(quizId) },
			  include: [{model: models.Comment }]
			  }).then(function(quiz){
			if (quiz){
				req.quiz = quiz;
				next();
			} else { next(new Error('No existe quizId=' + quizId));}
		}
	).catch(function(error) {next(error);});
};

// GET /quizes
exports.index = function(req, res) {
	var options = {};
	var favs=[];

	if(req.user){ // req.user es creado por autoload de usuario
				  // si la ruta lleva el párametro .quizId
		options.where = {UserId: req.user.id}
	}

	var busqueda = req.query.search;
	if(busqueda== null){
		models.Quiz.findAll(options).then(
			function(quizes){
				res.render('quizes/index.ejs', {quizes: quizes, errors: [], favs: favs});
			}
		).catch(function(error){ next(error);});
	} else {
		console.log("Lo que sale:" + busqueda + "."); // SQL orden alfabético por el campo de la tabla pregunta
		models.Quiz.findAll({where:['pregunta like ?','%' + busqueda + '%'], order: 'pregunta'}).then(
			function(quizes){
				res.render('quizes/index', { quizes: quizes, errors: []});
			}
		).catch(function(error){ next(error);});
	}


// Control de favoritos
	if(req.session.user){
		models.favourites.findAll({
			where: {UserId: Number(req.session.user.id) },
			order: 'QuizId ASC'
		}).then(function(a){
			for(index = 0; index < a.length;index++){
				favs.push(a[index].dataValues.QuizId);
			}
		})
	}
};

// GET /quizes/:id
exports.show = function(req, res) {
	res.render('quizes/show', { quiz: req.quiz, errors: [] });
};

// GET /quizes/:id/answer
exports.answer = function(req, res) {
	var resultado = 'Incorrecto';
	if(req.query.respuesta === req.quiz.respuesta){
		resultado = 'Correcto';
	}
	res.render(
		'quizes/answer',
		{ quiz: req.quiz,
		  respuesta: resultado,
		  errors: []
	    }
	);
};

// GET /quizes/new
exports.new = function(req, res){
	var quiz = models.Quiz.build( // Crea objeto Quiz
				{pregunta: "Pregunta", respuesta: "Respuesta"}
		);
	res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res){
	req.body.quiz.UserId = req.session.user.id;
	if(req.files.image){
		req.body.quiz.image = req.files.image.name;
	}
	var quiz = models.Quiz.build(req.body.quiz);

	// guarda en DB los campos pregunta y respuesta de quiz
	quiz
	.validate()
	.then(
		function(err){
			if(err) {
				res.render('quizes/new', {quiz: quiz, errors: err.errors});
			} else {
				quiz // save: guarda en DB campos pregunta y respuesta de quiz
				.save({fields: ["pregunta", "respuesta", "UserId", "image"]})
				.then(function(){res.redirect('/quizes')})
			}		// Redirección HTTP (URL relativo) lista de preguntas
		}
	);
};

// GET /quizes/:id/edit
exports.edit = function(req, res){
	var quiz = req.quiz; // Autoload de instancia de quiz

	res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res){

	if(req.files.image){
		req.body.quiz.image = req.files.image.name;
	}

	req.quiz.pregunta = req.body.quiz.pregunta;
	req.quiz.respuesta = req.body.quiz.respuesta,

	req.quiz
	.validate()
	.then(
		function(err){
			if(err) {
				res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
			} else {
				req.quiz    // Save: guarda campos pregunta y respuesta en DB
				.save( {fields: ["pregunta", "respuesta", "image"]})
				.then( function(){ res.redirect('/quizes');});
			}		// Redirección HTTP a lista de preguntas (URL relativo)
		}
	);
};

// DELETE /quizes/:id
exports.destroy = function(req, res){
	req.quiz.destroy().then( function() {
		res.redirect('/quizes');
	  }).catch(function(error){ next(error);});
};
