var path = require('path');

// Postgres DATABASE_URL = postgres://user:passed@host:port/database
// SQLite DATABASE_URL = sqlite://:@:/

var url = process.env.DATABASE_URL.match(/(.*)\:\/\/(.*?)\:(.*)@(.*)\:(.*)\/(.*)/);
var DB_name = (url[6]||null);
var user = (url[2]||null);
var pwd = (url[3]||null);
var protocol = (url[1]||null);
var dialect = (url[1]||null);
var port = (url[5]||null);
var host = (url[4]||null);
var storage = process.env.DATABASE_STORAGE;

// Cargar Modelo ORM
var Sequelize = require('sequelize');

// Usar BBDD SQLite:
var sequelize = new Sequelize(DB_name, user, pwd,
	{dialect: protocol,
	 protocol: protocol,
	 port: port,
	 host: host,
	 storage: storage,  // solo SQLite (.env)
	 omitNull:true		// solo PostGres
	}
);

// Importar la definicion de la tabla Quiz en quiz.js
var quiz_path = path.join(__dirname,'quiz');
var Quiz = sequelize.import(quiz_path);

// Importar definicion de la tabla Comment
var comment_path = path.join(__dirname,'comment');
var Comment = sequelize.import(comment_path);

// Importar definicion de la tabla Comment
var user_path = path.join(__dirname,'user');
var User = sequelize.import(user_path);

// Los comentarios pertenecen a una pregunta
Comment.belongsTo(Quiz);
Quiz.hasMany(Comment);

// Los quizes pertenecen a un usuario registrado
Quiz.belongsTo(User);
User.hasMany(Quiz);

//Relacion para favoritos
favourites = sequelize.define('favourites')
User.belongsToMany(Quiz, {through: 'favourites'});
Quiz.belongsToMany(User, {through: 'favourites'});

// Exportar tablas de Quiz, comentarios y usuarios
exports.Quiz = Quiz;
exports.Comment = Comment;
exports.User = User;
exports.favourites = favourites;

// sequelize.sync() crea e inicializa tabla de preguntas en DB
sequelize.sync().then(function(){
	//then(...) ejecuta el manejador una vez creada la tabla
	User.count().then(function (count){
		if(count === 0) { // la tabla se inicializa solo si está vacía
			User.bulkCreate(
				[ {username: 'admin', password: '1234', isAdmin: true},
				  {username: 'pepe', password: '5678'},
				  {username: 'jakemanray', password: 'jm'}
				]
			).then(function(){
				console.log('Base de datos inicializada');
				Quiz.count().then(function (count){
					if(count === 0){     // La tabla de inicializa sólo si está vacía
						Quiz.bulkCreate(
							[ {pregunta: 'Capital de Italia', respuesta: 'Roma', UserId: 2},
							  {pregunta: 'Capital de Portugal', respuesta: 'Italia', UserId: 2},
							]
						).then(function(){console.log('Base de datos inicializada')});
					};
				});
			});
		};
	});
});
