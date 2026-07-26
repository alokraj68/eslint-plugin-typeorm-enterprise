// Fixture for the oxlint JS-plugin smoke test. Every statement must be flagged.
repo.query('SELECT * FROM users');
qb.delete().from(User).execute();

const queryRunner = dataSource.createQueryRunner();
queryRunner.connect();
