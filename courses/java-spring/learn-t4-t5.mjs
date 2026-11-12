// Rewritten Learn content for T4 (entities → derived-queries) and T5 (records → validation).
// Only Learn fields live here; examples and exercises stay in the lesson files.
export const rewritesT4T5 = {

entities: {
  overview: "A database table stores data in rows and columns. An entity is a Java class that is mapped to a table: each object of the class becomes one row, and each field becomes one column. `@Entity` on `User` is how CometCarpool tells the library Hibernate to store users in a table.",
  goals: [
    "Explain how a class, its fields, and its objects map to a table, columns, and rows.",
    "Read @Entity, @Table, @Id, and @GeneratedValue on User.",
    "Predict the column name Hibernate picks for a field.",
  ],
  diagram: ["From the User class to the users table", [
    ["@Entity class User", "Marks the class as one that is stored in the database."],
    ["@Table(name = \"users\")", "Names the table. Without it, the table would be called user."],
    ["Fields become columns", "firstName becomes first_name, lastName becomes last_name, and email, password, id, and role keep their names."],
    ["new User(...) object", "One object is one row. Ana's User object is the row where email = ana@utdallas.edu."],
    ["save(user)", "Hibernate turns this call into an INSERT INTO users ... statement."],
  ]],
  sections: [
    ["Tables, rows, and entities", [
      "A relational database such as PostgreSQL keeps data in tables. A table has named columns, like email, and each stored record is a row. A table of users has one row per user.",
      "An entity is a class whose objects can be stored as rows. You add the annotation `@Entity` above the class. An annotation is a label that a library reads, as the earlier lesson on annotations explained.",
      "JPA is the standard Java vocabulary for this mapping, and Hibernate is the library that does the work. Hibernate reads your annotations and writes the SQL, the database's own language, for you.",
    ], "@Entity                       // store User objects in the database\n@Table(name = \"users\")        // the table is called users\npublic class User { ... }"],
    ["The id is the primary key", [
      "Every row needs one value that tells it apart from all others. That value is the primary key, and in Java you mark the field with `@Id`.",
      "`@GeneratedValue(strategy = GenerationType.IDENTITY)` says the database picks the number. PostgreSQL counts 1, 2, 3 and so on, so a new User has `id = null` until it is saved.",
      "The field is `Long`, not `long`, because a Long can hold null. A brand-new user has no id yet, and that null is how Spring Data later knows the object is new.",
    ], "@Id\n@GeneratedValue(strategy = GenerationType.IDENTITY)\nprivate Long id;   // null until the INSERT runs"],
    ["Field names become column names", [
      "By default Spring Boot turns camelCase field names into snake_case column names. The field `firstName` becomes the column `first_name`, and `email` stays `email`.",
      "Every field is mapped unless you mark it `@Transient`. So adding a field to User is enough to get a new column once the schema is updated.",
      "`@Table(name = \"users\")` is there because `user` is a reserved word in PostgreSQL. Naming the table `users` avoids that clash.",
    ]],
  ],
  walkthrough: ["What happens when CometCarpool registers Ana", [
    ["new User()", "Your code builds a User object in memory. Nothing is in the database yet, and its id is null."],
    ["user.setEmail(\"ana@utdallas.edu\")", "The setters fill in fields on the object. The row does not exist yet, so this is just Java memory."],
    ["repo.save(user)", "The repository hands the object to Hibernate. Hibernate sees that id is null, so it plans a new row."],
    ["INSERT INTO users (email, first_name, ...)", "Hibernate builds this SQL from the annotations. `firstName` was renamed `first_name`, and the id column is left out."],
    ["PostgreSQL assigns id = 1", "Because of IDENTITY, the database picks the next number. Hibernate reads it back and sets it on your object."],
    ["user.getId()", "Now it returns 1. The object and the row describe the same user."],
  ]],
  deeper: [
    ["See the SQL Hibernate runs", [
      "Set `spring.jpa.show-sql=true` in application.properties and Hibernate prints every statement it sends to the database. Register a user and you will see the INSERT with real column names. Reading it is the fastest way to check your annotations.",
    ]],
    ["Why JPA needs an empty constructor", [
      "When Hibernate loads a row, it must create a User first and fill in the fields afterward, because it cannot know your constructor's arguments. So an entity needs a constructor with no parameters. This is the reason User keeps `public User() {}`.",
    ]],
    ["ddl-auto and migrations", [
      "`spring.jpa.hibernate.ddl-auto=update` lets Hibernate create or alter tables to match your entities at startup. It is convenient, but it can drift from what you intended and does not remove old columns. Real projects use migration files with a tool such as Flyway, which is known issue #11.",
    ]],
    ["Common bug: a table that does not match", [
      "If you rename a field but the table keeps the old column, Hibernate's SQL names a column that does not exist and the database rejects the statement with an error. The entity is only a description; the table must agree with it.",
      "The next lesson shows a rule the table itself must enforce: uniqueness. See \"Only the database can guarantee uniqueness\".",
    ]],
  ],
  misconception: "The entity class is not the table. Hibernate writes SQL from the class, but the table lives in PostgreSQL and can drift out of step if you change one without the other.",
  takeaway: "One entity class maps to one table, one object to one row, and one field to one column.",
},

constraints: {
  overview: "A constraint is a rule the database itself enforces, such as UNIQUE, which allows no two rows to have the same value in a column. A Java check like `existsByEmail` is not enough to stop duplicate emails, because two requests can run at the same instant. Only a database constraint is a guarantee.",
  goals: [
    "Explain the check-then-insert race that creates duplicate emails.",
    "Add a unique constraint to the email column of User.",
    "Say which HTTP status to return when the constraint rejects an insert.",
  ],
  diagram: ["Two sign-ups for ana@utdallas.edu at the same instant", [
    ["Both ask existsByEmail", "Neither row is saved yet, so both get false."],
    ["Both think the email is free", "Each request continues to its save step."],
    ["Both run INSERT", "Without UNIQUE, the database accepts both and now holds two Ana rows."],
    ["With UNIQUE on email", "The first INSERT works. The second is rejected by the database."],
    ["Return 409 Conflict", "The Java code catches the rejection and answers with a clear message."],
  ]],
  sections: [
    ["The check-then-insert race", [
      "`saveUser` asks `existsByEmail(email)` first, and only if the answer is false does it save. That reads as safe, but it takes two separate steps: a question, then a write.",
      "A race condition means the result depends on the timing of two things that happen together. Here, two requests can both ask before either one writes, and both get false.",
      "Adding more Java `if` statements cannot close the gap, because the problem is the time between the question and the write. Java code running in two request threads cannot see each other's unsaved work.",
    ]],
    ["A constraint lives in the database", [
      "A UNIQUE constraint tells PostgreSQL to refuse any row whose email matches an existing one. The database handles each insert one at a time, so even simultaneous requests cannot both win.",
      "In the entity you write `@Column(unique = true, nullable = false)` on the email field. `nullable = false` also requires a value, so an empty email is refused too. A migration with `UNIQUE (email)` does the same job.",
      "When the database rejects the second insert, Spring throws `DataIntegrityViolationException`. The code should catch it and return 409 Conflict rather than a 500.",
    ], "@Column(unique = true, nullable = false)\nprivate String email;"],
  ],
  walkthrough: ["Two requests for ana@utdallas.edu, before and after the fix", [
    ["Request A: existsByEmail(\"ana@utdallas.edu\")", "The table is empty, so the answer is false. A decides the email is free."],
    ["Request B: existsByEmail(\"ana@utdallas.edu\")", "A has not inserted yet, so B also gets false. B decides the email is free too."],
    ["Request A: INSERT INTO users ...", "A's row is stored with id 1."],
    ["Request B: INSERT INTO users ...", "With no constraint this succeeds as id 2. The table now has two Ana rows, which is known issue #8."],
    ["Same race with UNIQUE on email", "B's INSERT is refused by PostgreSQL, because email = ana@utdallas.edu already exists. Only one row remains."],
    ["catch DataIntegrityViolationException", "The service turns the rejection into 409 Conflict with \"A user with this email already exists.\""],
  ]],
  deeper: [
    ["Keep existsByEmail anyway", [
      "The constraint does not make the Java check useless. The check gives a friendly error in the common case, before any insert is tried. The constraint is the safety net for the rare case where two requests collide.",
    ]],
    ["What the error looks like", [
      "The database error is wrapped by Spring as `DataIntegrityViolationException`. Its message contains raw SQL details such as the constraint name. Never send that text to the client: it leaks how your tables are built. Catch it and send your own message.",
    ]],
    ["Other constraints", [
      "NOT NULL requires a value, PRIMARY KEY is unique and not null, and a foreign key requires the referenced row to exist. All of these are rules the database enforces no matter which program writes the data.",
      "The lesson \"@ManyToOne links a row to its parent\" uses a foreign key.",
    ]],
    ["Common bug: emails that differ only by case", [
      "A unique constraint compares exact text, so Ana@utdallas.edu and ana@utdallas.edu count as different values. That is why registration should also lowercase emails first, as in the lesson on cleaning up strings.",
    ]],
  ],
  misconception: "Keeping the existsByEmail check does not make the constraint optional. The check gives a friendly message in the normal case, but only the constraint is a guarantee when requests overlap.",
  takeaway: "A rule that must always hold belongs in the database schema. Java checks help, but the constraint is the guarantee.",
},

"repository-save": {
  overview: "A repository is the class your code uses to store and find entities. Its `save` method does two jobs with one name: if the object's id is null it INSERTs a new row, and if the id is already set it UPDATEs the existing row. The example builds that rule by hand with a map.",
  goals: [
    "Explain how `save` decides between insert and update.",
    "Trace ids and row counts through a series of save calls.",
    "Explain why `findById` returns an Optional.",
  ],
  diagram: ["What save does with an id", [
    ["save(user)", "You hand the repository a User object."],
    ["Is id null?", "A null id means the object has never been stored."],
    ["Yes: INSERT", "A new row is created and the new id is written onto the object."],
    ["No: UPDATE", "The row with that id is replaced with the object's current values."],
    ["Returns the saved user", "Always use the returned object; it carries the id."],
  ]],
  sections: [
    ["One method, two outcomes", [
      "A repository gives you ready-made methods like `save`, `findById`, and `findAll`. In CometCarpool, `UserRepository extends JpaRepository<User, Long>`, and Spring Data supplies the code for you.",
      "`save` looks at the id. Because a new object's id is null (the field is a `Long`, not a `long`), null means insert. A non-null id means the row exists, so it updates it.",
      "That is why there is no separate `update` method. You change a field on an object you loaded, call `save` again, and the same row is rewritten.",
    ], "User saved = repo.save(user);   // INSERT if id == null, else UPDATE"],
    ["The example's in-memory repository", [
      "`rows` is a `Map<Long, User>`: it looks users up by id, like the table's primary key. `nextId` counts 1, 2, 3, standing in for the database's numbering.",
      "`if (u.id == null) u.id = nextId++;` gives a new object its id and then adds one to the counter. `rows.put(u.id, u)` stores the object under that id, replacing whatever was there.",
      "`findById` returns `Optional<User>`: a box that is either full or empty. `Optional.ofNullable(...)` makes an empty box when the id is missing, so callers must handle \"not found\".",
    ], "User save(User u) {\n    if (u.id == null) u.id = nextId++;  // new -> give an id\n    rows.put(u.id, u);                  // store or replace\n    return u;\n}"],
  ],
  walkthrough: ["Tracing the example's main method", [
    ["repo.save(new User(\"ana@...\"))", "Ana's id is null, so she gets id 1 and nextId becomes 2. The map holds {1=Ana}."],
    ["repo.save(new User(\"ben@...\"))", "Ben's id is null, so he gets id 2. The map holds {1=Ana, 2=Ben}."],
    ["a.id + \" \" + repo.findAll().size()", "a.id is 1 and there are 2 rows, so this prints: 1 2"],
    ["a.email = \"ana2@utdallas.edu\"", "In this in-memory version the map holds the very same object, so its email already reads ana2. A real database row would not change yet."],
    ["repo.save(a)", "a.id is 1, not null, so no new id is made. `put(1, a)` replaces the old entry: still 2 rows."],
    ["repo.findAll().size() + \" \" + repo.findById(1L).get().email", "Prints: 2 ana2@utdallas.edu"],
    ["repo.findById(5L).isPresent()", "No row has id 5, so the Optional is empty and this prints: false"],
  ]],
  deeper: [
    ["How Spring Data really decides", [
      "Spring Data calls an entity \"new\" when its id is null (for wrapper types like Long). For a new entity it asks JPA to persist it, which becomes an INSERT. Otherwise it merges it, which loads the row by id and copies your values onto it before an UPDATE.",
    ]],
    ["Always use the returned object", [
      "`save` returns the stored entity. For a new object that is the one you passed in, now with its id. When merging, JPA may hand back a different instance than the one you passed. Writing `user = repo.save(user);` is the safe habit.",
    ]],
    ["Saved even without save?", [
      "Inside a transaction, which is a group of database steps that succeed or fail together, JPA watches the entities it loaded and writes changed ones when the transaction ends. So an UPDATE can happen without a second call to save. Calling save explicitly is still clearer.",
    ]],
    ["Common bug: calling get() on an empty Optional", [
      "`findById(5L).get()` on an empty Optional throws `NoSuchElementException`. Check `isPresent()` first, or use `orElseThrow`. The lesson on Optional in the earlier tickets explains the safer patterns.",
    ]],
  ],
  misconception: "There is no separate update method. save both inserts and updates, and the only thing that decides which is whether the object's id is null.",
  takeaway: "A null id means INSERT and a set id means UPDATE. Use the object that save returns.",
},

"derived-queries": {
  overview: "A derived query is a method you only declare, and whose name is the query. Writing `List<Ride> findByDestination(String destination);` inside the repository interface is enough: Spring Data reads the name and writes the database query for you. The example writes by hand what Spring generates.",
  goals: [
    "Read a method name like findByDestination as a database query.",
    "Match the prefixes findBy, existsBy, and countBy to their results.",
    "Explain why the field name in the method must match the entity.",
  ],
  diagram: ["From a method name to rows", [
    ["You declare the method", "In the repository interface, with no body: findByDestination(String destination)."],
    ["Spring reads the name", "`find...By` means select, and `Destination` is the field to compare."],
    ["Spring writes the SQL", "select * from rides where destination = ?"],
    ["The argument fills the ?", "Calling findByDestination(\"UTD\") searches for UTD."],
    ["Rows become objects", "Each matching row is turned back into a Ride and returned in a List."],
  ]],
  sections: [
    ["The name is the query", [
      "A repository is an interface, which lists methods without bodies. For a derived query you write only the method signature. At startup Spring creates a class behind the interface that implements it.",
      "The words in the name are instructions. `findBy` selects rows, and the field name that follows, such as `Destination`, says which column to compare. The method's parameter supplies the value.",
      "You can join conditions with `And` and sort with `OrderBy`. For example `findByDriverIdOrderByDepartureAsc` means rides for one driver, earliest departure first.",
    ], "List<Ride> findByDestination(String destination);\nboolean existsByEmail(String email);\nlong countByDestination(String destination);"],
    ["Prefixes decide the return type", [
      "`findBy` returns the rows themselves: a `List<Ride>` for many, or an `Optional<User>` for at most one. `existsBy` returns a boolean, and `countBy` returns a number.",
      "`existsByEmail` becomes `select count(*) > 0 from users where email = ?`. That is how registration asks whether an email is taken without loading the whole user.",
      "The match is exact by default, so the case of the text can matter. `IgnoreCase` after the field, as in `findByEmailIgnoreCase`, compares without regard to capital letters.",
    ]],
  ],
  walkthrough: ["Tracing the example's findByDestination", [
    ["List.of(new Ride(1L, \"Ana\", \"UTD\", 3), ...)", "The `rides` list stands in for the rides table. It has two rows: Ana's to UTD with 3 seats, and Ben's to UTD with 0 seats."],
    ["findByDestination(rides, \"UTD\")", "The method receives the rows and the wanted destination, \"UTD\". It starts with an empty list `out`."],
    ["for (Ride r : rides)", "The loop visits Ana's ride, then Ben's ride, one at a time."],
    ["r.destination().equals(destination)", "Ana's destination is \"UTD\" and equals \"UTD\", so the ride is added to out. Ben's also matches, so it is added too."],
    ["return out", "The method returns both rides, which is what `where destination = ?` would select."],
    ["System.out.println(....size())", "`out` holds two rides, so this prints: 2"],
  ]],
  deeper: [
    ["What Spring does at startup", [
      "When the application starts, Spring Data parses each method name in the repository. It builds a query for it, and then creates the implementing object, called a proxy, that runs those queries. You never see the generated class.",
    ]],
    ["Common bug: a name that matches no field", [
      "If you write `findByDestinaton` (a typo) or name a field the entity does not have, Spring cannot build the query. The failure happens when the application starts, not when the method is first called, so you find out early.",
    ]],
    ["When names get too long", [
      "A name like `findByDriverIdAndDestinationAndSeatsGreaterThanOrderByDepartureAsc` works but is hard to read. For complex searches, you can write the query explicitly with the `@Query` annotation instead.",
    ]],
    ["Why equals, not ==", [
      "The example compares strings with `equals`, as in the lesson on comparing strings. The database does a value comparison too, so `where destination = ?` matches text with the same characters, not the same object.",
    ]],
  ],
  misconception: "The method has no body because there is nothing to write: the name is the query. But a misspelled field name is a startup failure, not something you can ignore.",
  takeaway: "A repository method name such as findByDestination or existsByEmail is read by Spring Data and turned into SQL.",
},

records: {
  overview: "A record is a short way to write a class that only carries data. `record UserResponse(Long id, String email) {}` gives you a constructor, readers named `id()` and `email()`, and `equals` and `toString` automatically. CometCarpool uses records for request and response objects.",
  goals: [
    "Declare a record with a one-line header.",
    "Read a record's values with its accessor methods like `r.email()`.",
    "Explain what a record gives you for free.",
  ],
  diagram: ["What one record line creates", [
    ["record UserResponse(Long id, String email)", "Declares a class with two components, id and email."],
    ["Fields", "Two private final fields are made, one per component."],
    ["Constructor", "new UserResponse(1L, \"ana@...\") sets both fields in one step."],
    ["Accessors", "id() and email() read the values back. There is no get prefix."],
    ["equals, hashCode, toString", "Generated, so printing shows UserResponse[id=1, email=ana@utdallas.edu]."],
  ]],
  sections: [
    ["A class that only carries data", [
      "A DTO, short for data transfer object, is a plain object whose only job is to carry values between parts of the program, such as from the controller to the browser. `LoginRequest` and `LoginResponse` are DTOs.",
      "As an ordinary class, a DTO needs fields, a constructor, getters, and often `equals` and `toString`: about 25 lines for two values. A record states the same thing in one line.",
      "The names in parentheses are the record's components. Each component becomes a field with a type and a name, just as in `class Ride` from the first ticket.",
    ], "record UserResponse(Long id, String email) {}"],
    ["Accessors and what you get for free", [
      "Java writes an accessor for each component. The accessor has the same name as the component, so you call `r.email()`, not `r.getEmail()`.",
      "Java also writes `toString`, which is why `System.out.println(r)` prints `UserResponse[id=1, email=ana@utdallas.edu]`. And it writes `equals`, which compares the components rather than the object's identity.",
      "A record's fields are final: once the object is built, they never change. There are no setters. To change a value, you build a new record.",
    ], "UserResponse r = new UserResponse(1L, \"ana@utdallas.edu\");\nSystem.out.println(r.email());   // ana@utdallas.edu"],
  ],
  walkthrough: ["Tracing the example", [
    ["record UserResponse(Long id, String email) {}", "Java generates a class with fields id and email, a constructor, accessors, equals, hashCode, and toString. The `{}` body is empty because nothing more is needed."],
    ["new UserResponse(1L, \"ana@utdallas.edu\")", "The constructor stores 1L in id and the text in email. The variable `r` refers to this object."],
    ["System.out.println(r)", "println calls the generated toString. It prints the record name and each component: UserResponse[id=1, email=ana@utdallas.edu]"],
    ["r.email()", "The accessor returns the email component, so println prints: ana@utdallas.edu"],
  ]],
  deeper: [
    ["Equality by value", [
      "Two records with equal components are equal: `new Seat(\"r1\", 2).equals(new Seat(\"r1\", 2))` is true. But `==` still compares whether both names refer to the same object, so it is false for two separately built records. The predict step shows this.",
    ]],
    ["Records are immutable", [
      "Because the fields are final, a record cannot be changed after it is built, and it has no setters. That makes it safe to share. This is also why records suit request and response objects: they carry data, and nobody edits them halfway.",
    ]],
    ["Custom checks in a compact constructor", [
      "You can add a compact constructor, which runs before the fields are set, to check values. It has the record's name and no parentheses. Throwing an exception there stops a bad record from ever existing.",
    ], "record Seat(String rideId, int number) {\n    Seat {\n        if (number < 1) throw new IllegalArgumentException(\"bad seat\");\n    }\n}"],
    ["Where records fit in Spring", [
      "Spring's JSON library, Jackson, can read and write records, so a record can be a request body or a response. Known issue #4 plans to replace the open User request with records. See \"Jackson turns objects into JSON\".",
    ]],
  ],
  misconception: "A record is not a shortcut for any class. It only suits objects that hold values and never change, and its accessors are `email()`, not `getEmail()`.",
  takeaway: "A record declares a data class in one line and gives you the constructor, accessors, equals, and toString.",
},

enums: {
  overview: "An enum is a type with a fixed list of allowed values. `enum Role { RIDER, DRIVER, ADMIN }` means a Role can be exactly one of those three and nothing else. CometCarpool stores role as free text today, so a client could send \"superadmin\"; an enum makes that impossible.",
  goals: [
    "Declare an enum and use one of its values.",
    "Turn text into an enum value with `valueOf`, and know it can fail.",
    "Use an enum in a switch so that every case is covered.",
  ],
  diagram: ["Role as an enum", [
    ["enum Role { RIDER, DRIVER, ADMIN }", "Creates a new type with exactly three values."],
    ["Role.DRIVER", "Names one value directly. Typos are caught when you compile."],
    ["Role.valueOf(\"DRIVER\")", "Turns text into the matching value, or fails if there is none."],
    ["r == Role.DRIVER", "Each value exists once, so == compares them safely."],
    ["switch (r)", "Handles each value, and the compiler can check none is missing."],
  ]],
  sections: [
    ["A type with a closed list", [
      "Until now a role was a `String`. A String can hold any text at all, including `\"superadmin\"` or a typo like `\"DRIVRE\"`, and nothing would stop it.",
      "An enum, short for enumeration, is a type whose values are a fixed list you write yourself. The names, by convention in capitals, are the only values that exist. You use them as `Role.DRIVER`.",
      "A method that takes a `Role` parameter can never receive anything else. The compiler rejects `Role.DRIVRE` because that name does not exist.",
    ], "enum Role { RIDER, DRIVER, ADMIN }\n\nRole r = Role.DRIVER;"],
    ["valueOf, ==, and switch", [
      "`Role.valueOf(\"DRIVER\")` finds the value whose name matches the text exactly. If no value has that name, it throws `IllegalArgumentException`, so check input before trusting it.",
      "Each enum value exists only once in the program, so `r == Role.DRIVER` is a correct comparison. You do not need `equals`, unlike with Strings.",
      "A `switch` over an enum lists one `case` per value. A switch expression, one that returns a value, must cover every value, so adding a new one makes the compiler point at every switch to update.",
    ], "switch (s) {\n    case OPEN -> \"Book now\";\n    case FULL -> \"Waitlist\";\n    case CANCELLED -> \"Gone\";\n}"],
  ],
  walkthrough: ["Tracing the example", [
    ["enum Role { RIDER, DRIVER, ADMIN }", "Java creates the Role type and exactly three values. No other Role can ever be made."],
    ["Role.valueOf(\"DRIVER\")", "valueOf looks through the three names for one equal to the text \"DRIVER\". It finds the second value and returns it."],
    ["Role r = ...", "The variable r now holds the DRIVER value."],
    ["System.out.println(r)", "Printing an enum shows its name, so this prints: DRIVER"],
    ["r == Role.DRIVER", "Both sides are the one DRIVER value that exists, so the comparison is true and the program prints: true"],
  ]],
  deeper: [
    ["Common bug: valueOf with bad text", [
      "`Role.valueOf(\"driver\")` fails, because the match is exact and case-sensitive. It throws `IllegalArgumentException` with a message saying there is no enum constant. When text comes from a client, catch this and return 400, or convert case first.",
    ]],
    ["values() and name()", [
      "`Role.values()` returns an array of every value in the order you declared them, so `Role.values().length` is 3. `name()` returns a value's name as a String, and `ordinal()` returns its position starting at 0.",
      "Avoid storing `ordinal()` in a database: inserting a new value in the middle would change every number.",
    ]],
    ["Enums in JPA", [
      "On an entity, `@Enumerated(EnumType.STRING)` stores the name, such as DRIVER, in the column. The default stores the position number instead, which breaks if you reorder the list. Prefer STRING.",
    ]],
    ["Enums can carry data", [
      "An enum is a class underneath, so values can hold fields and methods. For example each Role could hold a label to show in the UI. Keep that for when you need it; a plain list of names is the usual case.",
    ]],
  ],
  misconception: "An enum value is not a String. `Role.DRIVER` and \"DRIVER\" are different things, and turning text into the enum with `valueOf` can throw if the text does not match exactly.",
  takeaway: "An enum limits a value to a fixed list, so wrong values are caught by the compiler instead of at runtime.",
},

"http-status": {
  overview: "HTTP is the language browsers and servers use to talk. Every HTTP response starts with a status code, a three-digit number saying how the request went: 200 means OK, 404 means not found. The React app decides what to show from that number, so a controller must choose it on purpose.",
  goals: [
    "Say what the main status codes mean: 200, 201, 400, 401, 403, 404, and 500.",
    "Tell the 2xx, 4xx, and 5xx families apart.",
    "Explain why a missing ride should be 404, not 200 with nothing.",
  ],
  diagram: ["Reading a status code", [
    ["2xx: it worked", "200 OK for a normal answer. 201 Created after a POST made something new."],
    ["4xx: the request was wrong", "400 bad input, 401 not logged in, 403 not allowed, 404 not found."],
    ["5xx: the server failed", "500 means a bug or crash on the server."],
    ["The client branches on it", "React shows a ride on 200, a form error on 400, and “not found” on 404."],
  ]],
  sections: [
    ["What the number tells the client", [
      "When the browser sends a request such as `GET /api/rides/9`, the server answers with a status code, headers, and often a body. The status code is the first part of that answer.",
      "The first digit is the family. 2xx means success, 4xx means the client sent something wrong, and 5xx means the server itself failed. The family tells the caller whose fault it is.",
      "The React app does not parse a message to know what happened. It checks the number: 201 means “account created”, 400 means “fix the form”, 404 means “ride not found”.",
    ]],
    ["Choosing codes in a controller", [
      "A controller method that just returns a value sends 200 OK. That is right for a normal read, but wrong for others: creating a user should send 201 Created.",
      "To pick another code, return a `ResponseEntity`, an object holding both the status and the body. `ResponseEntity.status(HttpStatus.CREATED).body(user)` sends 201 and the user as JSON.",
      "For a missing thing, send 404 rather than 200 with an empty body, because a 200 tells the client everything went fine.",
    ], "return ResponseEntity\n    .status(HttpStatus.CREATED)  // 201\n    .body(user);                 // the JSON body"],
  ],
  walkthrough: ["Tracing the example's meaning method", [
    ["static String meaning(int code)", "A method that turns a status number into its standard name. The `switch` inside it picks the first matching case."],
    ["meaning(201)", "The code 201 is passed in as the parameter `code`."],
    ["case 201 -> \"Created\"", "The switch finds the case 201 and returns \"Created\". The `default` case is not reached."],
    ["System.out.println(...)", "Prints: Created"],
    ["meaning(404)", "This time the switch finds `case 404 -> \"Not Found\"`."],
    ["System.out.println(...)", "Prints: Not Found. A code with no matching case, like 418, would return \"Other\"."],
  ]],
  deeper: [
    ["Common bug: returning null", [
      "A controller method that returns `null` sends 200 OK with an empty body, not 404. The client thinks the request worked. If the lookup finds nothing, return `ResponseEntity.notFound().build()` instead.",
    ]],
    ["401 versus 403", [
      "401 means the server does not know who you are, and 403 means it knows but you may not do this. See \"401 means who are you; 403 means not allowed\" in the security lessons.",
    ]],
    ["More codes you will meet", [
      "409 Conflict means the request clashes with existing data, such as a duplicate email. 400 is the usual code for invalid input. 204 No Content means success with nothing to send back, often after a DELETE.",
    ]],
    ["Codes versus messages", [
      "The status line also includes a short phrase, like “Not Found”, but programs read only the number. Put the details for people in the response body, as in the later lesson \"One handler turns exceptions into responses\".",
    ]],
  ],
  misconception: "A response is not “successful” just because the server answered. A 404 or 500 is still a complete response, and the client must read the status code to know what happened.",
  takeaway: "The status code is the client's main signal. Choose 2xx for success, 4xx for the caller's mistake, and 5xx only for real server failures.",
},

json: {
  overview: "JSON is the text format a Spring backend uses to send data to the React app. An object becomes `{\"id\":1,\"email\":\"ana@utdallas.edu\"}`: curly braces, quoted keys, and values. Jackson, the library inside Spring, builds that text from your object. The example writes the same text by hand.",
  goals: [
    "Read and write JSON objects and arrays.",
    "Say which values are quoted and which are not.",
    "Predict the exact JSON for a record or response.",
  ],
  diagram: ["From a Java object to a response body", [
    ["Controller returns an object", "For example new UserResponse(1L, \"ana@utdallas.edu\")."],
    ["Jackson reads its components", "Each record component or getter becomes a JSON key."],
    ["Jackson writes text", "{\"id\":1,\"email\":\"ana@utdallas.edu\"}"],
    ["Sent as the response body", "With a header saying the content is application/json."],
    ["React parses it", "Axios turns the text back into a JavaScript object."],
  ]],
  sections: [
    ["What JSON looks like", [
      "JSON, short for JavaScript Object Notation, is plain text that describes data. Both Java and JavaScript can read and write it, which is why it is the format between the backend and the React app.",
      "An object is written between curly braces as `\"key\":value` pairs separated by commas. An array, a list of values, uses square brackets: `[1,2]`.",
      "Keys are always in double quotes. Strings are in double quotes too, but numbers (`3`), booleans (`true`, `false`), and `null` are written bare, with no quotes.",
    ], "{\"id\":1,\"email\":\"ana@utdallas.edu\",\"seats\":3,\"ok\":true,\"note\":null}"],
    ["Jackson writes it for you", [
      "A library is code someone else wrote for you to use. Jackson is the library that turns Java objects into JSON and back. Spring uses it automatically when a controller returns an object.",
      "Each field or record component becomes a key with the same name. A record `LoginResponse(String token)` becomes `{\"token\":\"abc\"}`.",
      "The example builds the JSON with string joining so you can see the exact characters. In the real app you return the object and never write the braces yourself.",
    ], "static String json(Long id, String email) {\n    return \"{\\\"id\\\":\" + id + \",\\\"email\\\":\\\"\" + email + \"\\\"}\";\n}"],
  ],
  walkthrough: ["Tracing the example", [
    ["json(1L, \"ana@utdallas.edu\")", "The method is called with the id 1 and the email text."],
    ["\"{\\\"id\\\":\"", "Inside a Java string, `\\\"` is one double-quote character. So this piece is the text {\"id\": with no quotes around the number to come."],
    ["+ id", "Joining a Long puts in its digits, 1, unquoted. The text is now {\"id\":1"],
    ["+ \",\\\"email\\\":\\\"\"", "Adds a comma, then the quoted key email, a colon, and the opening quote of the value."],
    ["+ email + \"\\\"}\"", "The email text goes in, followed by a closing quote and the closing brace."],
    ["System.out.println(...)", "Prints: {\"id\":1,\"email\":\"ana@utdallas.edu\"}"],
  ]],
  deeper: [
    ["Why the quotes look messy in Java", [
      "A Java string is itself written between double quotes, so a quote inside it needs a backslash: `\\\"`. The backslash is not part of the text. That is why building JSON by hand is error-prone, and why Jackson exists.",
    ]],
    ["Null and missing values", [
      "A Java null becomes the JSON `null`, as in `{\"note\":null}`. In Jackson you can configure it to leave such keys out. The frontend should handle both a null and a missing key.",
    ]],
    ["Hiding a field", [
      "`@JsonIgnore` on a field tells Jackson to skip it. That is why `password` in User is never sent to the browser. Without it, the hash would appear in every response.",
    ]],
    ["Reading JSON too", [
      "Jackson works in both directions. The `@RequestBody` annotation on a controller parameter makes it read the incoming JSON into an object. See \"A controller maps method + path to a handler\".",
    ]],
  ],
  misconception: "JSON is not a Java thing, and it is not code. It is just text, so a value like 3 is a number and \"3\" is a string, and the frontend treats them differently.",
  takeaway: "JSON is text: quoted keys, quoted strings, bare numbers, booleans, and null. Jackson turns your objects into it.",
},

controllers: {
  overview: "A controller is the class that receives web requests. Each method is tied to an HTTP method (like GET or POST) and a path (like /api/users/1), and Spring calls the matching method. The example does this routing with plain `if` statements so you can see what the annotations do.",
  goals: [
    "Explain what an HTTP method and a path are.",
    "Trace how a request is matched to one handler.",
    "Explain why an unmatched request gets 405 or 404.",
  ],
  diagram: ["How a request finds its handler", [
    ["Request arrives", "For example GET /api/users/1 from the React app."],
    ["Match the method", "Is it GET, POST, DELETE, and so on?"],
    ["Match the path", "Does the path start with /api/users/?"],
    ["Run the handler", "The controller method that matched runs and builds a Response."],
    ["Status and body go back", "200 with the email, or 404 if the user does not exist."],
  ]],
  sections: [
    ["Method plus path picks the handler", [
      "A web request has an HTTP method that says the intention, such as GET to read or POST to create, and a path that says which resource, such as `/api/users/1`.",
      "In Spring you write a class marked `@RestController`. Each method has an annotation like `@GetMapping(\"/users/{id}\")` that says which method and path it answers.",
      "At runtime Spring's request router, called the DispatcherServlet, looks at each request and calls the one method whose mapping matches.",
    ], "@GetMapping(\"/api/users/{id}\")\npublic UserResponse getUser(@PathVariable Long id) {\n    ...\n}"],
    ["The example does the routing by hand", [
      "`handle(method, path)` checks `method.equals(\"GET\") && path.startsWith(\"/api/users/\")`. That is what `@GetMapping` does for you.",
      "`path.substring(...)` cuts off the prefix, leaving the id, and `Long.parseLong` turns that text into a number. Spring does this when you write `{id}` and `@PathVariable`.",
      "If nothing matches, the method falls through to the last line and returns 405, Method Not Allowed. A missing user gives 404 with \"Not found\".",
    ], "if (method.equals(\"GET\") && path.startsWith(\"/api/users/\")) {\n    ...\n}\nreturn new Response(405, \"Method not allowed\");"],
  ],
  walkthrough: ["Tracing the three requests in main", [
    ["c.handle(\"GET\", \"/api/users/1\")", "The method is GET and the path starts with /api/users/, so the first `if` matches."],
    ["path.substring(\"/api/users/\".length())", "Cuts the prefix off \"/api/users/1\", leaving \"1\". Long.parseLong turns it into the number 1."],
    ["users.get(1L)", "The map holds {1=ana@utdallas.edu}, so email is found and the result is Response[status=200, body=ana@utdallas.edu]."],
    ["c.handle(\"GET\", \"/api/users/9\")", "The route matches, but users.get(9L) returns null. The result is Response[status=404, body=Not found]."],
    ["c.handle(\"DELETE\", \"/api/users/1\")", "The method is DELETE, so the `if` fails. It falls through to Response[status=405, body=Method not allowed]."],
  ]],
  deeper: [
    ["What the annotations hide", [
      "`@RestController` marks the class and `@RequestMapping(\"/api\")` adds a shared prefix. The mapping annotations are read at startup, when Spring builds a table of every method and path. Requests are then matched against it. See \"Annotations are labels Spring reads at runtime\".",
    ]],
    ["405 versus 404", [
      "In Spring, a path that exists but with the wrong HTTP method gets 405 Method Not Allowed, and a path with no mapping at all gets 404. The example collapses both into 405 to keep it short.",
    ]],
    ["Common bug: a bad id in the path", [
      "`Long.parseLong(\"abc\")` throws `NumberFormatException`. In Spring, a path such as /api/users/abc fails to convert to a Long and the request is answered with 400. A global handler can turn that into a clear message.",
    ]],
    ["Keep controllers thin", [
      "A controller should only translate between HTTP and your code: read the request, call a service, and choose the status. The rules, like checking emails, belong in the service.",
    ]],
  ],
  misconception: "A controller is not called by your own code. You never write `controller.getUser(...)`. Spring calls it when a request matches its method and path.",
  takeaway: "A request's HTTP method and path select exactly one controller method, and its return value becomes the response.",
},

errors: {
  overview: "When code throws an exception during a web request, someone must turn it into a response. A global exception handler is one place that catches exceptions from every controller and maps each type to a status code and a message. The example's `handle` method is a hand-built version of that.",
  goals: [
    "Explain how an exception becomes an HTTP status code.",
    "Choose 400, 404, or 500 for a given exception type.",
    "Explain why one handler gives consistent errors.",
  ],
  diagram: ["An exception on its way out", [
    ["Code throws", "For example NotFoundException(\"Ride 9 not found\")."],
    ["Nobody catches it in the controller", "It travels up out of the controller method."],
    ["The global handler catches it", "In Spring this is a class marked @RestControllerAdvice."],
    ["Pick a status by type", "NotFound gives 404, IllegalArgument gives 400, anything else gives 500."],
    ["Send one consistent response", "Every error has the same shape, so the frontend handles them the same way."],
  ]],
  sections: [
    ["Why a handler is needed", [
      "An exception is an object that signals something went wrong, and `throw` sends it up the call stack until something catches it. The earlier lessons on try-catch and throw covered this.",
      "In a web app nobody up the stack is a person. If nothing catches the exception, Spring replies with a generic 500, which tells the client nothing helpful.",
      "A global handler is a class with methods that each catch one kind of exception. Every controller benefits, and you write the mapping once.",
    ], "@RestControllerAdvice\npublic class GlobalExceptionHandler {\n    @ExceptionHandler(IllegalArgumentException.class)\n    ResponseEntity<String> bad(IllegalArgumentException e) { ... }\n}"],
    ["Mapping exception types to statuses", [
      "The type of the exception tells you whose fault it was. A missing ride is 404, bad input like “Seats must be 1-7” is 400, and an unexpected failure is 500.",
      "The example's `handle` uses `e instanceof NotFoundException` to ask whether the exception is of that type. The first match wins, and the last line catches everything else.",
      "`NotFoundException extends RuntimeException` defines your own exception type: `extends` means it is a kind of RuntimeException, and `super(message)` passes the text to the parent.",
    ], "if (e instanceof NotFoundException) return new Response(404, e.getMessage());\nif (e instanceof IllegalArgumentException) return new Response(400, e.getMessage());\nreturn new Response(500, \"Something went wrong\");"],
  ],
  walkthrough: ["Tracing the three calls in main", [
    ["call(() -> \"ok\")", "`call` receives a small function. `action.get()` runs it and returns \"ok\", so no exception happens: Response[status=200, body=ok]."],
    ["call(() -> { throw new NotFoundException(...) })", "This time `action.get()` throws NotFoundException with the message \"Ride 9 not found\". The `catch (RuntimeException e)` block catches it."],
    ["handle(e)", "`e instanceof NotFoundException` is true, so handle returns Response(404, e.getMessage()). It prints Response[status=404, body=Ride 9 not found]."],
    ["call(() -> { throw new IllegalStateException(\"db down\"); })", "It is a RuntimeException, so `call` catches it. But it is neither NotFound nor IllegalArgument."],
    ["return new Response(500, ...)", "handle reaches its last line and returns a generic message. It does not reveal \"db down\": Response[status=500, body=Something went wrong]."],
  ]],
  deeper: [
    ["How Spring finds the handler", [
      "`@RestControllerAdvice` marks a class whose `@ExceptionHandler` methods apply to every controller. When an exception escapes a controller, Spring picks the handler whose declared type is the closest match to the exception.",
    ]],
    ["Do not leak internals", [
      "For an unexpected exception, send a generic message, as the example does. Real messages such as “db down” or SQL text help attackers and confuse users. Log the details on the server instead.",
    ]],
    ["One consistent shape", [
      "Known issue #10 asks for every error to share one JSON shape, for example `{\"status\":404,\"message\":\"...\"}`. A frontend that always finds the same keys needs just one error-handling path.",
    ]],
    ["Why RuntimeException", [
      "RuntimeException and its subclasses are unchecked: the compiler does not force you to declare or catch them. That is why a service can throw one without every method up the chain needing `throws`. See the lesson on throw.",
    ]],
  ],
  misconception: "An exception does not become a nice error message by itself. Without a handler, the client gets a bare 500, so each exception type you care about needs a mapping.",
  takeaway: "One global handler maps exception types to status codes and messages, so every endpoint reports errors the same way.",
},

validation: {
  overview: "Validation means checking that incoming data is acceptable before using it, at the edge where the request arrives. Good validation collects every problem into one list so the user can fix them all at once. The example builds a `validate` method that returns that list; Spring's annotations do the same job.",
  goals: [
    "Explain why input is validated at the edge of the app.",
    "Write checks that put a message for each problem into a list.",
    "Explain why a null check must come before a length check.",
  ],
  diagram: ["Validating a RegisterRequest", [
    ["Request arrives", "The JSON is read into a RegisterRequest record."],
    ["Check the email", "Is it present, and does it end in @utdallas.edu?"],
    ["Check the password", "Is it present and at least 8 characters?"],
    ["Collect problems", "Each failure adds one message to a list; checking does not stop at the first."],
    ["Empty list or 400", "No problems: continue. Otherwise answer 400 with the whole list."],
  ]],
  sections: [
    ["Check at the edge", [
      "The edge is where outside data first enters your program, here the controller. Anything a client sends could be missing, empty, or malformed, so you check it before it reaches the service or the database.",
      "Failing early gives the user a clear message. Bad data that slips through can cause a confusing crash later or, worse, get saved.",
      "A good answer is 400 Bad Request with every problem listed, not just the first, so the user fixes the whole form in one go.",
    ]],
    ["Collecting every error", [
      "The example creates `List<String> errors = new ArrayList<>();` and each failed check does `errors.add(\"email: must not be blank\")`. The method returns the list at the end, which is empty if everything is fine.",
      "Order matters in a condition. `r.email() == null || r.email().isBlank()` tests for null first, because `isBlank()` on null throws a `NullPointerException`. The `||` stops at the first true part, so the second part never runs on null.",
      "Each message begins with the field name, like `password:`, so the frontend can show it next to the right input.",
    ], "if (r.password() == null || r.password().length() < 8)\n    errors.add(\"password: size must be at least 8\");"],
    ["What Spring does for you", [
      "Spring Boot's validation starter lets you write the rules as annotations on the record: `@NotBlank`, `@Email`, `@Size(min = 8)`. Putting `@Valid` before the `@RequestBody` parameter makes Spring run them.",
      "If any rule fails, Spring rejects the request with 400 before your method runs. The hand-written version shows exactly what those annotations check.",
    ], "record RegisterRequest(\n    @NotBlank @Email String email,\n    @Size(min = 8) String password) {}"],
  ],
  walkthrough: ["Tracing the two calls in main", [
    ["validate(new RegisterRequest(\"ana@utdallas.edu\", \"longenough\", \"Ana\"))", "Creates an empty `errors` list, then runs the checks on this valid request."],
    ["r.email() == null || r.email().isBlank()", "The email is neither null nor blank, so the `else if` runs: it ends with @utdallas.edu, so no error. The password has 10 characters, so no error."],
    ["System.out.println(errors)", "Nothing was added, so it prints: []"],
    ["validate(new RegisterRequest(\"\", \"short\", null))", "A second request with an empty email and a 5-character password."],
    ["r.email().isBlank()", "The empty text is blank, so \"email: must not be blank\" is added. The `else if` is skipped."],
    ["r.password().length() < 8", "\"short\" has length 5, so \"password: size must be at least 8\" is added. The null firstName is never checked."],
    ["System.out.println(errors)", "Prints: [email: must not be blank, password: size must be at least 8]"],
  ]],
  deeper: [
    ["Validation does not replace constraints", [
      "Edge validation gives friendly errors, but the database still needs its own rules. See \"Only the database can guarantee uniqueness\": a format check cannot tell whether an email is already taken.",
    ]],
    ["Common bug: forgetting @Valid", [
      "The annotations on the record do nothing unless the controller parameter has `@Valid`. The code compiles and runs, but bad data passes straight through, because Spring only runs rules where you ask it to.",
    ]],
    ["Null versus empty versus blank", [
      "null means no value at all. An empty string has length 0, and a blank string is empty or only spaces, so `\"   \".isBlank()` is true but `\"   \".isEmpty()` is false. `@NotBlank` rejects null, empty, and blank values.",
    ]],
    ["Where the 400 comes from", [
      "When a rule fails, Spring throws `MethodArgumentNotValidException`. A global handler, as in \"One handler turns exceptions into responses\", can turn it into your consistent JSON error with all the field messages.",
    ]],
  ],
  misconception: "Validation is not the same as a database constraint. It catches bad input early and politely, but it cannot guarantee things that depend on other requests.",
  takeaway: "Check input where it enters, collect every problem in one list, and test for null before calling methods on a value.",
},

};
