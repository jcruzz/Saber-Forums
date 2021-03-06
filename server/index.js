// ========================================
// SERVER AND DATABASE INITIALIZED
// ========================================

const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database/index.js');

const app = express();

app.use(express.static(`${__dirname}/../react-env/dist`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// ========================================
// AUTHENTICATION PACKAGES
// ========================================

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');

// =========================================
// AUTHENTICATION MIDDLEWARE
// =========================================

app.use(session({
  secret: 'dasdasdsadasd',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60000 }, // one hour
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(db.UserModel.authenticate()));
passport.serializeUser(db.UserModel.serializeUser());
passport.deserializeUser(db.UserModel.deserializeUser());


// ========================================
// OTHER ROUTES
// ========================================
app.get('/', (req, res) => {
  if (req.url !== '/') {
    res.writeHead(400, null);
    res.end();
  } else {
    db.fetch() // TODO --> will be whatever the database call it <--- TODO
      .then(results => res.json(results))
      .catch(err => console.log(err));
  }
  console.log('Now processing get from external source');
});

// ========================================
// AUTHENTICATION ROUTES
// ========================================


// Simple logout call
app.post('/logout', (req, res) => {
  req.logout();
  res.end();
});

// The route called by props.auth / this.props authenticator clientside
// This is simply to check if there is a session in place
app.get('/login', (req, res) => {
  const isLoggedIn = req.isAuthenticated();
  const result = {};

  if (isLoggedIn) {
    result.user = req.user;
  }

  result.isLoggedIn = isLoggedIn;

  res.json(result);
});


// TODO: make this work with Login
app.post('/login', passport.authenticate('local'), (req, res) => {
  res.end();
});

app.get('/Users', (req, res) => {
  db.findUserPromise({ _id: req.query.id })
    .then((data) => {
      res.send(data[0]);
    });
});


// The sign up route,

app.post('/Users', (req, res) => {
  const model = {
    role: 'generalUser',
    username: req.body.username,
    email: req.body.email,
  };


  db.UserModel.register(new db.UserModel(model), req.body.password, (err, user) => {
    if (err) {
      console.log(err);
    }
    passport.authenticate('local')(req, res, () => {
      console.log('you have registered and authenticated', user);
      res.end();
    });
  });
});

app.get('/email', (req, res) => {
  let emailExists = false;
  let userExists = false;

  db.findUserPromise({ email: req.query.email })
    .then((data) => {
      if (data.length > 0) {
        emailExists = true;
      }

      return db.findUserPromise({ username: req.query.username });
    })
    .then((data) => {
      if (data.length > 0) {
        userExists = true;
      }

      res.json({
        email: emailExists,
        username: userExists,
      });
    });
});

app.get('/Threads', (req, res) => {
  console.log('Now processing get for Threads');
  db.findThreadPromise({})
    .then((data) => {
      res.json(data);
    });
});

//  Handles newly created threads.
app.post('/Threads', (req, res) => {
  console.log('Now processing post for Threads');
  return new Promise((resolve, reject) => {
    if (req.body) {
      resolve(db.saveThread(req.body));
    } else {
      reject();
    }
  })
    .then(() => res.send())
    .catch((reason) => {
      console.error(reason);
      res.end();
    });
});

//  When a thread is selected on the client, it fetches associated comments through here.
app.get('/Comments', (req, res) => {
  console.log('Now processing get for Comments');
  const parentThreadId = req.query.threadId;
  db
    .findCommentsPromise(parentThreadId)
    .then(results => res.send(results))
    .catch((reason) => {
      console.error(reason);
      res.end();
    });
});

// Handles newly posted comments.
app.post('/Comments', (req, res) => {
  console.log('Now processing post for Comments');
  return new Promise((resolve, reject) => {
    if (req.body) {
      resolve(db.saveComment(req.body));
    } else {
      reject();
    }
  })
    .then(() => res.send())
    .catch((reason) => {
      console.error(reason);
      res.end();
    });
});

// ===============================
// UPVOTE/DOWNVOTE COMMENTS
// ===============================

app.patch('/vote', (req, res) => {
  const update = req.body.method === 'upvote' ? { $inc: { vote: 1 } } : { $inc: { vote: -1 } };

  db.CommentModel.findOneAndUpdate({ _id: req.body.commentId }, update)
    .then(() => {
      console.log('successful upvote/downvote is successful');
    });


  res.end();
});

// ===============================
// LISTENER
// ===============================
app.listen(process.env.PORT || 3000);
