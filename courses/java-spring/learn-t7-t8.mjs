// Rewritten Learn content for T7 (streams, local-times, relationships) and T8 (testing).
export const rewritesT7T8 = {

streams: {
  overview: "A stream is a way to describe what you want done to a collection, step by step, instead of writing a loop. `rides.stream().filter(r -> r.seats() > 0).map(Ride::driver).toList()` reads as: from the rides, keep those with seats, take each driver, and collect the result into a new list.",
  goals: [
    "Read a pipeline of stream, filter, map, and toList.",
    "Say what filter keeps and what map changes.",
    "Explain why the original list is left unchanged.",
  ],
  diagram: ["Searching rides with a stream", [
    ["rides.stream()", "Starts a pipeline over the three rides: Ana, Ben, and Cam."],
    ["filter(r -> r.seats() > 0)", "Keeps only rides with open seats: Ana's and Cam's."],
    ["map(Ride::driver)", "Replaces each ride with its driver's name."],
    ["toList()", "Collects what is left into a new list: [Ana, Cam]."],
    ["rides itself", "Still holds all three rides. Streams never change the source."],
  ]],
  sections: [
    ["A pipeline instead of a loop", [
      "A stream is a sequence of values you can process in stages, written as a chain of method calls. It starts with `.stream()` on a list, passes through steps, and ends with a step that produces a result.",
      "Each step takes a lambda, the small nameless function from the earlier lesson, to say what to do with each value. `r -> r.seats() > 0` is a lambda that takes a ride and answers true or false.",
      "The chain reads top to bottom like a sentence. You describe what you want, not how to loop, count, and add to a temporary list.",
    ], "rides.stream()\n    .filter(r -> r.seats() > 0)   // keep some\n    .map(Ride::driver)            // change each one\n    .toList();                    // collect the result"],
    ["filter, map, and the final step", [
      "`filter` keeps the values for which the lambda returns true and drops the rest. The result has the same kind of values, just fewer of them.",
      "`map` turns every value into something else. `Ride::driver` is a method reference, short for `r -> r.driver()`, so a stream of rides becomes a stream of driver names.",
      "`toList()` ends the pipeline by collecting the values into a new list. Other endings are `count()`, which counts them, and `mapToInt(...).sum()`, which adds numbers.",
      "The original `rides` list is never modified. A stream reads from it and builds a separate result.",
    ]],
  ],
  walkthrough: ["Tracing the example", [
    ["List.of(new Ride(\"Ana\", \"UTD\", 3), new Ride(\"Ben\", \"Plano\", 0), new Ride(\"Cam\", \"UTD\", 1))", "The list holds three rides: Ana with 3 seats, Ben with 0, and Cam with 1."],
    ["rides.stream()", "A stream is opened over the list. It will hand the rides, one by one, to the next step."],
    ["filter(r -> r.seats() > 0)", "Ana's 3 > 0 is true, so she stays. Ben's 0 > 0 is false, so he is dropped. Cam's 1 > 0 is true, so she stays."],
    ["map(Ride::driver)", "The two remaining rides become their drivers' names: \"Ana\" and \"Cam\"."],
    ["toList()", "The names are collected into a new list, and println prints: [Ana, Cam]"],
    ["rides.size()", "The original list was never changed, so it still has 3 rides. The program prints: 3"],
  ]],
  deeper: [
    ["Streams are lazy", [
      "Nothing happens until the final step runs. `filter` and `map` only describe the work, and `toList()` triggers it. If you build a stream and never end it, no lambda runs at all.",
    ]],
    ["A stream is used once", [
      "A stream can be consumed only one time. Reusing it throws an `IllegalStateException` saying the stream has already been operated upon or closed. Just call `rides.stream()` again to start a new pipeline.",
    ]],
    ["Common bug: expecting the list to change", [
      "Writing `rides.stream().filter(...);` alone and then using `rides` expects it to be filtered. It is not, because the stream produced a separate result you did not keep. This is the same trap as in \"String methods return a new String\".",
    ]],
    ["Where this is used in CometCarpool", [
      "Searching rides (UC-02 and UC-03) can filter by destination and seats, then sort and collect. For database-sized data, a repository query such as \"Method names become queries\" is better, because the database filters before the rows reach Java.",
    ]],
  ],
  misconception: "A stream is not a new list and it does not change the old one. It is a recipe that runs when you finish it with toList, count, or sum.",
  takeaway: "stream() starts, filter keeps, map transforms, and toList collects. The source list stays exactly as it was.",
},

"local-times": {
  overview: "A LocalDateTime is a date and a time on a wall clock, such as 8:30 on 7 November 2026, with no time zone attached. It is the right type for a ride's departure time. You shift it with methods like `minusMinutes` and compare it with `isBefore` and `isAfter`.",
  goals: [
    "Create a LocalDateTime with `LocalDateTime.of(...)`.",
    "Shift it with plus and minus methods.",
    "Compare two times and pull out a date, hour, or day of week.",
  ],
  diagram: ["Working with a departure time", [
    ["LocalDateTime.of(2026, 11, 7, 8, 30)", "Year, month, day, hour, minute: 7 November 2026 at 08:30."],
    ["minusMinutes(45)", "Returns a new LocalDateTime 45 minutes earlier: 07:45."],
    ["plusDays(1)", "Returns a new one a day later: 8 November at 08:30."],
    ["toLocalDate()", "Drops the time and keeps only the date: 2026-11-08."],
    ["isBefore / isAfter", "Compare two times, for rules like “no cancelling within 2 hours”."],
  ]],
  sections: [
    ["A wall-clock date and time", [
      "A ride leaves at “8:30 on 7 November”. That is what a person reads off a clock and calendar, and it is the same whether you are in Dallas or not. LocalDateTime models exactly that, and it carries no time zone.",
      "You build one with `LocalDateTime.of(year, month, day, hour, minute)`. The hour uses a 24-hour clock, and the month is a plain number from 1 to 12.",
      "There are two simpler relatives: `LocalDate` holds only a date and `LocalTime` holds only a time of day.",
    ], "LocalDateTime departs = LocalDateTime.of(2026, 11, 7, 8, 30);"],
    ["Shifting and comparing", [
      "Methods such as `plusDays`, `minusHours`, and `minusMinutes` move a time forward or back. They are immutable, like Strings: each returns a new LocalDateTime and leaves the original alone.",
      "`isBefore` and `isAfter` compare two times and return true or false. A rule like “riders cannot cancel within 2 hours of departure” is a comparison with `departs.minusHours(2)`.",
      "Getters such as `getHour()`, `getDayOfWeek()`, and `toLocalDate()` pull out pieces. Printing a LocalDateTime shows ISO text like `2026-11-07T07:45`.",
    ], "departs.minusMinutes(45)          // 2026-11-07T07:45\ndeparts.plusDays(1).toLocalDate()   // 2026-11-08"],
  ],
  walkthrough: ["Tracing the example", [
    ["LocalDateTime.of(2026, 11, 7, 8, 30)", "Creates the time 8:30 on 7 November 2026. The variable `departs` refers to it."],
    ["departs.minusMinutes(45)", "Subtracts 45 minutes: 8:30 minus 45 is 7:45 on the same day. This builds a new LocalDateTime."],
    ["System.out.println(...)", "The new value is printed in ISO format: 2026-11-07T07:45"],
    ["departs.plusDays(1)", "Starting again from the original 8:30 on the 7th, add one day. This builds 8:30 on 8 November."],
    [".toLocalDate()", "Converts to a LocalDate, keeping only the date part."],
    ["System.out.println(...)", "The date is printed without a time: 2026-11-08"],
  ]],
  deeper: [
    ["Why no time zone", [
      "LocalDateTime cannot say which moment in history it means, because 8:30 happens at a different instant in every zone. That is fine for “departure at 8:30 local campus time”. For an exact moment, such as a token's expiry, use Instant: \"Instant + Duration computes deadlines\".",
    ]],
    ["Common bug: ignoring the returned value", [
      "`departs.minusHours(2);` on its own line does nothing, because LocalDateTime is immutable. You must write `LocalDateTime cutoff = departs.minusHours(2);` and use `cutoff`.",
    ]],
    ["Month overflow and daylight saving", [
      "Adding days handles month and year ends for you: `LocalDate.of(2026, 12, 31).plusDays(1)` is 2027-01-01. But a LocalDateTime knows nothing about clock changes for daylight saving, so “plus 24 hours” across a change is about wall-clock arithmetic, not real elapsed time.",
    ]],
    ["Storing it", [
      "JPA can store a LocalDateTime in a timestamp column. Validation can also require a future departure with the `@Future` annotation. See \"Validate input at the edge, collecting every error\".",
    ]],
  ],
  misconception: "plusDays and minusHours do not change the time they are called on. They return a new LocalDateTime, so you must keep the result.",
  takeaway: "LocalDateTime is a date plus a clock time. Shift it with plus and minus, compare with isBefore and isAfter, and keep the results.",
},

relationships: {
  overview: "A relationship connects rows in two tables: many rides belong to one driver. In JPA, `@ManyToOne` on `Ride.driver` adds a driver_id column to the rides table that holds the id of a row in users. That column is called a foreign key, and it lives on the many side.",
  goals: [
    "Explain what a foreign key column is.",
    "Put `@ManyToOne` on the correct side of a relationship.",
    "Describe the two links a RideRequest needs.",
  ],
  diagram: ["rides.driver_id points to users.id", [
    ["users row: id 1, Ana", "The one side. Ana is a single user."],
    ["rides rows: 10, 11, 12", "The many side. Ana drives three rides."],
    ["driver_id = 1 on each ride", "Every ride stores Ana's id, not a copy of her details."],
    ["@ManyToOne on Ride.driver", "The Java field that maps to the driver_id column."],
    ["ride.getDriver()", "JPA follows the id and gives you the User object."],
  ]],
  sections: [
    ["One driver, many rides", [
      "One user can offer many rides, but each ride has exactly one driver. This is a many-to-one relationship, read from the ride's side: many rides, one driver.",
      "In a table, the many side stores the link. The rides table gets a column `driver_id` holding the `id` of a row in `users`. A column that refers to another table's primary key is a foreign key.",
      "The database enforces it: you cannot store a ride whose driver_id matches no user. This is one of the constraints from \"Only the database can guarantee uniqueness\".",
    ]],
    ["Writing it in Java", [
      "In the Ride entity you declare a field of type User and mark it `@ManyToOne`. You do not write an id field by hand: JPA creates the `driver_id` column from the field name.",
      "`optional = false` makes the column NOT NULL, so a ride cannot exist without a driver.",
      "A RideRequest has two links: `@ManyToOne User rider` and `@ManyToOne Ride ride`. Each request points to one rider and one ride, so both are many-to-one from the request's side.",
    ], "@ManyToOne(optional = false)\nprivate User driver;   // column: driver_id"],
  ],
  walkthrough: ["Ana offers three rides", [
    ["users: id 1, ana@utdallas.edu", "Ana registers. She is one row in users, as in the entities lesson."],
    ["new Ride(); ride.setDriver(ana);", "In Java, the ride's driver field refers to Ana's User object."],
    ["repo.save(ride)", "Hibernate inserts a row into rides. Instead of Ana's details, it writes only her id."],
    ["INSERT INTO rides (driver_id, ...) VALUES (1, ...)", "The foreign key stores 1. Two more rides get the same driver_id of 1."],
    ["ride.getDriver()", "When loading, JPA reads driver_id = 1 and finds the users row with id 1, giving you Ana as a User object."],
    ["Change Ana's email", "Only the one users row changes, so every ride sees the new email. Nothing was copied."],
  ]],
  deeper: [
    ["Why not copy the driver's email into the ride?", [
      "A copy goes stale: when the email changes, every ride still shows the old one. A relationship stores one id and always reads the current data from the single users row.",
    ]],
    ["The other directions", [
      "`@OneToMany` is the same relationship seen from the user's side: one user, a list of rides. You can skip it and query from the many side instead, as in \"Method names become queries\", which keeps User simple.",
    ]],
    ["Lazy loading", [
      "For @ManyToOne, JPA by default loads the driver together with the ride. You can choose `fetch = FetchType.LAZY`, which loads the driver only when you first use it. Using a lazy field after the database session has closed causes a LazyInitializationException.",
    ]],
    ["Common bug: the wrong side", [
      "Putting a list of rides inside User and no link in Ride makes the model awkward and the table wrong. The foreign key always lives on the many side, here the ride.",
    ]],
  ],
  misconception: "A relationship is not a copy of the other object's data. The ride stores only the driver's id, and the full user is found by following that id.",
  takeaway: "The many side holds the foreign key. @ManyToOne on Ride.driver creates a driver_id column pointing at users.id.",
},

testing: {
  overview: "A test is a small program that runs your code with known input and checks that the output is what you expect. A good test fails when the code is wrong. That is how it proves anything, so you check it by breaking the code on purpose and watching the test fail.",
  goals: [
    "Write the three parts of a test: set up, act, check.",
    "Replace a real dependency with a mock so the test controls it.",
    "Explain why a test must be able to fail.",
  ],
  diagram: ["Anatomy of one test", [
    ["Arrange", "Build UserService with a fake repository that says the email already exists."],
    ["Act", "Call register(\"ana@utdallas.edu\")."],
    ["Assert: it threw", "Check that an IllegalArgumentException came out with the right message."],
    ["Assert: no side effect", "Check that save was never called."],
    ["Break the code to test the test", "Remove the duplicate check and make sure this test now fails."],
  ]],
  sections: [
    ["What a test is", [
      "A test runs a piece of your program and compares the result with what you expect. In Java the standard tool is JUnit: you write methods marked `@Test`, and JUnit runs each one and reports pass or fail.",
      "A test has three parts. Arrange sets up the objects and input. Act calls the code under test. Assert checks the outcome, for example that the right exception was thrown.",
      "Because the checks run automatically, you can change the code later and learn within seconds whether you broke something.",
    ], "@Test\nvoid rejectsDuplicateEmail() {\n    // arrange, act, assert\n}"],
    ["Mocks stand in for dependencies", [
      "UserService needs a UserRepository, which in real life talks to a database. A test should not need a database. Because the service takes its repository through the constructor, a test can pass in a fake one instead.",
      "A fake used in a test is called a mock. The example's `MockRepo` implements UserRepository and returns whatever the test sets: `repo.exists = true` makes every email look taken. It also records each `save` call in a list.",
      "Mockito is a library that creates mocks for you with `mock(UserRepository.class)`, then `when(...).thenReturn(true)` sets what a method returns, and `verify(...)` checks it was called or never called.",
    ], "MockRepo repo = new MockRepo();\nrepo.exists = true;                 // the email is \"taken\"\nUserService s = new UserService(repo);"],
    ["A test must be able to fail", [
      "A test that always passes proves nothing. It may be checking the wrong thing, or nothing at all.",
      "To trust a test, break the code on purpose. Delete the duplicate check from `register` and run the test: it should now fail. If it still passes, the test is not protecting you.",
      "Good tests check the outcomes that matter: the right exception, the exact message, and that nothing was saved.",
    ]],
  ],
  walkthrough: ["Tracing the example's duplicate-email test", [
    ["MockRepo repo = new MockRepo(); repo.exists = true;", "A fake repository is created. Setting exists to true means existsByEmail will answer true for any email."],
    ["UserService s = new UserService(repo);", "The service receives the fake through its constructor, with no database involved."],
    ["s.register(\"ana@utdallas.edu\")", "The email passes the UTD check. It is trimmed and lowercased, and then register asks the repository whether it exists."],
    ["repo.existsByEmail(email)", "The mock answers true, so register throws IllegalArgumentException(\"A user with this email already exists.\") before it can save."],
    ["catch (IllegalArgumentException e)", "The test catches it and prints: PASS: A user with this email already exists."],
    ["repo.saved.size()", "save was never called, so the list is empty and the program prints: saved calls: 0"],
  ]],
  deeper: [
    ["What happens when the code is broken", [
      "Imagine register forgot the existsByEmail check. Then `register` would not throw, the `try` block would print “FAIL: no exception”, and `saved calls` would be 1. That failing result is what shows the test can detect the bug.",
    ]],
    ["JUnit in real projects", [
      "In the real UserServiceTest you use `assertThrows(IllegalArgumentException.class, () -> service.register(...))` and `assertEquals`. Maven runs them with `./mvnw test`. The example here uses plain Java because the exercises run without downloading JUnit.",
    ]],
    ["Mocks versus real objects", [
      "Mock the things at the edge, like the repository and PasswordEncoder, so the test is fast and focused on UserService's own rules. Do not mock the class you are testing, or you test nothing.",
    ]],
    ["Common bug: checking only the happy path", [
      "Tests that only cover valid input miss the bugs in the rules. For UserService also test the rejections: a non-UTD email, a duplicate, and bad logins. See \"A class receives its dependencies through the constructor\" for why this design makes mocking easy.",
    ]],
  ],
  misconception: "A passing test is not automatically a good test. A test only has value if it would fail when the code is wrong, so check that by breaking the code.",
  takeaway: "Arrange, act, assert, with mocks standing in for dependencies. A good test fails when the code is wrong.",
},

};
