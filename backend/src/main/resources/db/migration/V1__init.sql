CREATE TABLE users (
                       id            uuid                        NOT NULL,
                       email         varchar(255)                NOT NULL,
                       password_hash varchar(60)                 NOT NULL,
                       created_at    timestamp(6) with time zone NOT NULL,
                       CONSTRAINT pk_users      PRIMARY KEY (id),
                       CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE tasks (
                       id          uuid                        NOT NULL,
                       title       varchar(255)                NOT NULL,
                       description varchar(2000),
                       completed   boolean                     NOT NULL,
                       priority    varchar(10)                 NOT NULL,
                       category    varchar(255)                NOT NULL,
                       due_date    timestamp(6) with time zone,
                       created_at  timestamp(6) with time zone NOT NULL,
                       updated_at  timestamp(6) with time zone NOT NULL,
                       owner_id    uuid                        NOT NULL,
                       CONSTRAINT pk_tasks          PRIMARY KEY (id),
                       CONSTRAINT fk_tasks_owner    FOREIGN KEY (owner_id) REFERENCES users (id),
                       CONSTRAINT ck_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
);

-- Postgres does not index foreign keys automatically, and every task query filters by owner.
CREATE INDEX idx_tasks_owner_id ON tasks (owner_id);