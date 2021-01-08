const mongoose = require('mongoose');

const connect = () => {
  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true);
  }

  mongoose.connect(
    'mongodb://localhost/corona',
    {
      dbName: 'corona',
      useNewUrlParser: true,
      // useCreateIndex: true,
      useUnifiedTopology: true,
    },
    error => {
      if (error) {
        console.log('mongodb connect error', error);
      } else {
        console.log('mongodb connect success');
      }
    },
  );
};

mongoose.connection.on('error', error => {
  console.log('mongodb connection error', error);
});

mongoose.connection.on('disconnected', () => {
  console.error('mongodb disconnected try reconnect');
});

module.exports = connect;
