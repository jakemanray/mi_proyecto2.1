var models = require('../models/models.js');
var quizes = [];

//MW para hacer una pregunta favorita
exports.new = function(req, res, next){
	var quiz = req.quiz;
	var user = req.user;

	user.hasQuiz(quiz).then(function(result){
		if(result){
			next();
			return;
		} else {
			user.addQuiz(quiz).then(function(){
				user.hasQuiz(quiz).then(function(result){
				})
			})
		}
		res.redirect(req.session.redir.toString());
	});

}

//MW para quitar una pregunta de favorita
exports.destroy = function(req, res){
	var quiz = req.quiz;
	var user = req.user;

user.hasQuiz(quiz).then(function(result){
		if(result){

			user.removeQuiz(quiz).then(function(){
				user.hasQuiz(quiz).then(function(result){
				})
			})
		} else {
		}
		res.redirect(req.session.redir.toString());
	});
}

//Mw para listar preguntas favoritas
exports.list = function(req, res){
	var favs = [];
	var quizes2 = [];
	index = 0;
	index2 = 0;
	var idB;

		models.favourites.findAll({
			where: {UserId: Number(req.session.user.id) },
			//order: 'QuizId ASC'
		}).then(function(a){
						quizes = [];
			for(index = 0; index < a.length;index++){
			favs.push(a[index].dataValues.QuizId);
			}
		}).then(function(){
			index2 = 0;
		}).then(function(){
				if(favs.length > 0 ){
			for(index2 = 0; index2 < favs.length; index2++){
				idB=favs[index2];

				models.Quiz.find({
					where:{ id: Number(idB)},
					order: 'pregunta ASC',
					include: [{model: models.Comment}]
					}).then(function(quiz){
						quizes.push(quiz);
						}).then(function(){
							if(quizes.length === favs.length){
								res.render('quizes/index.ejs', {quizes: quizes, errors: [], favs: favs});
								}
							});
			}
		} else {
			res.render('quizes/index.ejs', {quizes: quizes, errors: [],  favs: favs});
		}
});

}
