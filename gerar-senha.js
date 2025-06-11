const bcrypt = require('bcryptjs');
bcrypt.hash('Gestao@5511', 10).then(console.log);