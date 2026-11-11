// Spring nanolessons: one idea each. Verified exercises are reused from spring-source.mjs.
import { lesson, conceptLesson, program, checks, learn } from './helpers.mjs';
import { spring as v1, HASH, JWT, sha, jwtHelpers } from './spring-source.mjs';

const S = 'https://docs.spring.io/';
const src = id => structuredClone(v1.find(l => l.id === id));

// Reuse a whole verified lesson, retitled to its single idea, with Learn cut to two sections.
function trimmed(id, title, keep, overview) {
  const l = src(id);
  l.title = title; l.minutes = 6;
  l.learn.sections = keep.map(i => l.learn.sections[i]);
  if (overview) l.learn.overview = overview;
  return l;
}

// Reuse a verified lesson's exercises but replace Learn with a fully rewritten, beginner-first version.
function rewritten(id, title, o) {
  const l = src(id);
  l.title = title; l.minutes = 8;
  l.learn = learn({ ...o, tryIt: o.tryIt || l.learn.tryIt });
  return l;
}

const userRepo = 'class User {\n    Long id;\n    String email;\n    User(String email) { this.email = email; }\n}';
const rideRec = 'record Ride(Long id, String driver, String destination, int seats) {}';

export const spring = [

rewritten('annotations', "Annotations are labels Spring reads at runtime", {
  "overview": "An annotation is a label that starts with @, like `@GetMapping(\"/api/test\")`, placed on a class, method, or field. On its own a label does nothing. Spring reads these labels when the app starts and acts on them: `@GetMapping` turns a method into a web endpoint.",
  "goals": [
    "Explain what an annotation is and why it does nothing by itself.",
    "Read each part of an annotation declaration: `@interface`, `value()`, and `@Retention`.",
    "Describe how Spring uses reflection to find labels and act on them."
  ],
  "diagram": [
    "From label to behavior",
    [
      [
        "@GetMapping(\"/api/test\")",
        "You put a label on the `test()` method."
      ],
      [
        "@Retention(RUNTIME)",
        "The label is kept in the compiled program, so it still exists while the app runs."
      ],
      [
        "Spring starts",
        "It looks at every method in your controller classes."
      ],
      [
        "getAnnotation(...)",
        "For each method it asks: does this one carry a @GetMapping label?"
      ],
      [
        "Route registered",
        "If it does, requests to that path now call that method."
      ]
    ]
  ],
  "sections": [
    [
      "What an annotation is",
      [
        "An annotation is a label written as @ plus a name, placed right above a class, method, or field. `@GetMapping(\"/api/test\")` sits above the `test()` method.",
        "The label adds information about the code but runs no code itself. Reading the label and doing something about it is another program's job, here Spring's.",
        "Some labels carry a value. In `@GetMapping(\"/api/test\")`, the text in parentheses is the web path this method should answer."
      ],
      "@GetMapping(\"/api/test\")        // the label and its value\npublic String test() {           // the method it labels\n    return \"CometCarpool backend is up and running\";\n}"
    ],
    [
      "Declaring your own annotation",
      [
        "`@interface GetMapping` declares a new annotation type named GetMapping. The @ in front of `interface` is what makes it an annotation instead of a normal interface.",
        "`String value();` declares one setting the label holds. Writing `@GetMapping(\"/api/test\")` stores that text in `value`, and code reads it back by calling `value()`.",
        "`@Retention(RetentionPolicy.RUNTIME)` is a label on the label. It tells Java to keep GetMapping visible while the program runs. Without it, running code cannot see the label at all."
      ],
      "@Retention(RetentionPolicy.RUNTIME)  // keep this label at runtime\n@interface GetMapping {             // a new annotation type\n    String value();                 // the path, e.g. \"/api/test\"\n}"
    ],
    [
      "Reflection: code that inspects code",
      [
        "Reflection means a running program looking at its own classes: listing their methods, checking their labels, and calling methods it found. Spring is built on it.",
        "`TestController.class.getDeclaredMethods()` returns every method written in TestController. In the example that is `test` and `helper`.",
        "`m.getAnnotation(GetMapping.class)` asks method `m` for its GetMapping label. It returns the label if there is one and null if not, which is why the example checks `g != null`.",
        "`m.invoke(new TestController())` calls method `m` on a new TestController. It does the same as `controller.test()`, except the method is chosen while the program runs."
      ],
      "for (Method m : TestController.class.getDeclaredMethods()) {\n    GetMapping g = m.getAnnotation(GetMapping.class);\n    if (g != null) {                       // only labeled methods\n        System.out.println(g.value() + \" -> \" + m.invoke(new TestController()));\n    }\n}"
    ]
  ],
  "walkthrough": [
    "What the example does, step by step",
    [
      [
        "TestController.class.getDeclaredMethods()",
        "Java hands back TestController's two methods, `test` and `helper`. The loop visits them one at a time (Java does not promise an order)."
      ],
      [
        "m.getAnnotation(GetMapping.class)   // m is test",
        "`test` has `@GetMapping(\"/api/test\")`, so `g` is that label. `g` is not null, so the if body runs."
      ],
      [
        "g.value() + \" -> \" + m.invoke(...)",
        "`g.value()` is \"/api/test\". `invoke` calls `test()`, which returns \"CometCarpool backend is up and running\"."
      ],
      [
        "System.out.println(...)",
        "Prints: /api/test -> CometCarpool backend is up and running"
      ],
      [
        "m.getAnnotation(GetMapping.class)   // m is helper",
        "`helper` has no label, so `g` is null. The if is skipped and `helper` is never called. That is what \"not routed\" means."
      ],
      [
        "",
        "Spring does the same thing at startup across all your classes: every method with a mapping label becomes a route, and every other method is ignored."
      ]
    ]
  ],
  "misconception": "An annotation never runs code by itself. `@GetMapping` works only because Spring reads it at startup. A label that no code ever looks for changes nothing.",
  "takeaway": "Annotations are labels. Frameworks like Spring use reflection to find them and turn them into behavior.",
  "deeper": [
    [
      "What the CometCarpool labels tell Spring",
      [
        "`@RestController` marks a class whose methods answer web requests and return data, like text or JSON, directly. `@RequestMapping(\"/api\")` on the class adds a path prefix, so `@GetMapping(\"/test\")` on a method becomes `GET /api/test`.",
        "`@Service`, `@Repository`, and `@Component` mark classes Spring should create and manage. `@Entity` marks a class that maps to a database table. Each label is read by a different part of Spring or JPA."
      ]
    ],
    [
      "The three retention levels",
      [
        "SOURCE: the label exists only in your .java file and the compiler throws it away. `@Override` works this way: the compiler checks it, then drops it. CLASS, the default, keeps the label in the .class file but hides it from reflection. RUNTIME keeps it visible to reflection.",
        "That is why, in the Predict step, `@Note` (no @Retention, so CLASS) is invisible to `isAnnotationPresent`, while `@Service` (RUNTIME) is found. Every Spring annotation is RUNTIME."
      ]
    ],
    [
      "Common bug: the label is right but nothing happens",
      [
        "If a class has `@GetMapping` methods but is missing `@RestController`, Spring never looks inside it and the endpoint returns 404. The code compiles fine, because the compiler never checks whether anyone reads a label.",
        "The same happens when the class sits outside the package Spring scans. The lesson \"Spring only scans its own package and below\" covers that case."
      ]
    ],
    [
      "Why the example says throws Exception",
      [
        "`m.invoke(...)` can fail in ways the compiler cannot check ahead of time: the method might be private, or might throw an exception itself. So `invoke` declares checked exceptions, and the example's `main` uses `throws Exception` to let them pass through.",
        "Spring handles all of this for you, which is why your controllers never touch reflection directly."
      ]
    ]
  ]
}),
rewritten('injection', "A class receives its dependencies through the constructor", {
  "overview": "A dependency is an object a class needs to do its job: UserService needs a UserRepository. With dependency injection the class does not create that object with `new`. It asks for it in its constructor, and whoever builds the class passes it in: Spring in the app, you in a test.",
  "goals": [
    "Explain what a dependency is and what \"injecting\" one means.",
    "Write a class that receives its dependency through the constructor.",
    "Explain why Spring creates one shared object, a bean, per class."
  ],
  "diagram": [
    "Who builds what in the example",
    [
      [
        "new MemoryUserRepository()",
        "Built first, because it needs nothing."
      ],
      [
        "new UserService(repo)",
        "The repository is passed in through the constructor."
      ],
      [
        "new UserController(service)",
        "The service is passed in the same way."
      ],
      [
        "c.post(...)",
        "The controller calls the service, which calls the repository."
      ]
    ]
  ],
  "sections": [
    [
      "What a dependency is",
      [
        "A dependency is an object a class needs to do its work. UserService must check whether an email already exists, so it depends on a UserRepository.",
        "UserService could make one itself with `new MemoryUserRepository()`. But then it is stuck with that exact class: switching to the real database, or to a fake in a test, means editing UserService.",
        "Dependency injection means the class receives the object from outside instead. \"Injecting\" is just passing it in as a constructor argument, so whoever builds UserService decides which repository it gets."
      ]
    ],
    [
      "Asking through the constructor",
      [
        "`private final UserRepository repo;` declares a field to hold the dependency. `private` hides it from other classes. `final` means it must be set once, in the constructor, and can never be reassigned.",
        "The constructor `UserService(UserRepository repo)` lists the dependency as a parameter, and `this.repo = repo;` stores it in the field, exactly like the constructors in T1.",
        "The parameter's type is the interface UserRepository, not one specific class. Any object that implements the interface can be passed in, which is what makes swapping easy."
      ],
      "class UserService {\n    private final UserRepository repo;   // the dependency\n\n    UserService(UserRepository repo) {   // ask for it\n        this.repo = repo;                // keep it\n    }\n}"
    ],
    [
      "Spring does the wiring",
      [
        "In the real app you never write these `new` calls. Spring creates every class marked `@Service`, `@Repository`, or `@RestController` at startup. Each object Spring creates and manages is called a bean.",
        "Spring reads each constructor's parameters, builds those beans first, and passes them in. By default it makes just one bean per class and shares it with everyone who asks for it."
      ]
    ]
  ],
  "walkthrough": [
    "How the example wires itself and runs",
    [
      [
        "UserRepository repo = new MemoryUserRepository();",
        "Build the dependency first. This fake repository says only \"ana@utdallas.edu\" exists."
      ],
      [
        "UserService service = new UserService(repo);",
        "Pass the repository in. The constructor stores it in the field `repo`."
      ],
      [
        "UserController c = new UserController(service);",
        "The same pattern one level up: the controller receives the service and stores it."
      ],
      [
        "c.post(\"ana@utdallas.edu\")",
        "The controller calls `service.register`, which calls `repo.existsByEmail`. That returns true, so `register` returns \"duplicate\"."
      ],
      [
        "System.out.println(...)",
        "Prints: POST /api/users -> duplicate"
      ],
      [
        "c.post(\"ben@utdallas.edu\")",
        "This time `existsByEmail` is false, so it prints: POST /api/users -> ok"
      ]
    ]
  ],
  "misconception": "Spring does not create a new UserService for every request. It builds one and shares it, so storing per-user data in its fields is a bug: every user would see the same value.",
  "takeaway": "Ask for what you need in the constructor and keep it in a final field. The caller, Spring or your test, decides which object you get.",
  "deeper": [
    [
      "How Spring decides the build order",
      [
        "At startup Spring reads every bean's constructor and works out who needs whom. It creates beans with no dependencies first, then the ones that need them. In CometCarpool that is roughly UserRepository and PasswordEncoder, then UserService, then UserController.",
        "When a class has exactly one constructor, Spring uses it automatically. Older code puts `@Autowired` on the constructor; with a single constructor that label is optional."
      ]
    ],
    [
      "Beans are shared (singletons)",
      [
        "By default Spring creates one bean per class and hands that same object to everyone who asks. This is called singleton scope. It is safe as long as the bean keeps no per-request data in its fields.",
        "The Predict step shows the idea: two objects given the same Counter both add to one shared count."
      ]
    ],
    [
      "@Bean methods: beans for classes you don't own",
      [
        "You cannot put `@Service` on a library class like PasswordEncoder, because you don't own its source code. Instead, a method marked `@Bean` inside a `@Configuration` class creates the object, and Spring treats what it returns as a bean. SecurityConfig's `passwordEncoder()` works this way."
      ]
    ],
    [
      "Common startup errors",
      [
        "\"No qualifying bean of type X\": some constructor asks for an X, but Spring never created one. Usually the class is missing its annotation or sits outside the scanned package.",
        "\"The dependencies of some of the beans form a cycle\": A needs B and B needs A through their constructors, so neither can be built first. It usually means one class is doing too much and should be split."
      ]
    ]
  ]
}),

conceptLesson({
  id: 'maven', title: 'pom.xml decides what\'s on the classpath', file: 'pom.xml',
  explanation: ['Maven reads pom.xml, downloads each dependency, and builds the app; ./mvnw runs a pinned Maven.', 'A Spring Boot "starter" is one dependency that pulls in a whole feature.'],
  overview: "A Java project uses code written by others, called libraries or dependencies. pom.xml lists them. Maven, the build tool, reads that list, downloads each library, and puts it on the classpath: the places Java searches for classes. If a library isn't in pom.xml, your code cannot use it.",
  goals: [
  "Explain what pom.xml, Maven, and the classpath each are.",
  "Match each Spring Boot starter in pom.xml to the feature it brings.",
  "Know when a change to pom.xml actually takes effect."
],
  diagram: [
  "What ./mvnw spring-boot:run does",
  [
    [
      "Read pom.xml",
      "Maven reads the list of dependencies."
    ],
    [
      "Download",
      "Any library not yet on your machine is fetched from Maven Central and cached in ~/.m2."
    ],
    [
      "Compile",
      "Your files in src/main/java become .class files in target/classes."
    ],
    [
      "Run",
      "Java starts BackendApplication.main with every library on the classpath."
    ]
  ]
],
  sections: [
  [
    "Maven and pom.xml",
    [
      "Maven is a build tool: a program that downloads libraries, compiles your code, runs your tests, and packages the app. pom.xml (Project Object Model) is its instruction file.",
      "Each `<dependency>` entry names one library by its group and artifact name. Maven downloads it, plus every library that one needs in turn.",
      "`./mvnw` is the Maven wrapper: a script in the repo that downloads and runs the exact Maven version the project expects, so every teammate builds the same way."
    ]
  ],
  [
    "Starters: one line, a whole feature",
    [
      "A starter is a dependency that pulls in a whole bundle of libraries for one feature. You add one entry instead of ten.",
      "In CometCarpool the webmvc starter brings controllers and JSON, data-jpa brings repositories and Hibernate, security brings the login filter chain, validation brings `@Valid`, and postgresql is the database driver.",
      "`spring-boot-starter-parent` at the top of the file pins versions that are known to work together. That is why most starters list no version of their own."
    ]
  ],
  [
    "The classpath",
    [
      "The classpath is the list of folders and .jar files Java searches whenever your code mentions a class. Maven builds it from pom.xml.",
      "When you write `import jakarta.persistence.Entity;`, that class must be on the classpath. If its library is missing from pom.xml, compiling fails with \"package jakarta.persistence does not exist\"."
    ]
  ]
],
  walkthrough: [
  "You add the validation starter. What happens?",
  [
    [
      "<artifactId>spring-boot-starter-validation</artifactId>",
      "You save the new dependency in pom.xml. Nothing changes yet: your IDE and the running app still use the old classpath."
    ],
    [
      "Reload Maven",
      "Your IDE's Maven reload button, or the next ./mvnw command, re-reads pom.xml and downloads the new library into ~/.m2."
    ],
    [
      "Compile",
      "Code that uses `@Valid` now compiles, because the validation library is on the classpath."
    ],
    [
      "Restart the app",
      "A running app loaded its classes when it started. Only a restart picks up the new library, and only then does `@Valid` actually check anything."
    ]
  ]
],
  misconception: "Editing pom.xml does nothing to an app that is already running. Maven has to reload the file and the app has to restart before a new library exists for your code.",
  takeaway: "pom.xml is the project's shopping list. Maven fetches what it lists and puts it on the classpath; anything not listed doesn't exist to your code.",
  tryIt: 'Open comet-carpool/src/backend/pom.xml and find spring-boot-starter-security.',
  deeper: [
  [
    "Transitive dependencies",
    [
      "Libraries depend on other libraries. Adding data-jpa also downloads Hibernate, the database connection layer, and dozens more. These are called transitive dependencies.",
      "`./mvnw dependency:tree` prints the whole tree. It is the first thing to check when two libraries want different versions of the same thing."
    ]
  ],
  [
    "Scopes: when a library is available",
    [
      "A dependency can have a `<scope>`. The default, compile, is available everywhere. `test` is only on the classpath while tests run, which is where JUnit and Mockito belong. `runtime` is needed to run but not to compile, which commonly fits a database driver like postgresql."
    ]
  ],
  [
    "Where downloads and build output go",
    [
      "Maven caches every downloaded library in ~/.m2/repository on your machine. The first build is slow because it downloads everything; later builds reuse the cache.",
      "target/ holds Maven's output: compiled classes and the packaged .jar. It is generated, so it stays out of git."
    ]
  ],
  [
    "Commands worth knowing",
    [
      "`./mvnw spring-boot:run` compiles and starts the app. `./mvnw test` runs the tests. `./mvnw package` builds a runnable .jar in target/. `./mvnw clean` deletes target/ when a build seems stuck on old output."
    ]
  ]
],
  example: 'Open pom.xml in comet-carpool/src/backend and read the dependencies list. This is a conceptual checkpoint; no code runs.',
  predict: { prompt: 'You delete spring-boot-starter-data-jpa from pom.xml and rebuild. What breaks? A: UserRepository and @Entity no longer compile; B: only the tests; C: nothing, since Spring Boot includes JPA anyway.', answer: 'A', explanation: 'JPA annotations and JpaRepository come from that starter. Without it, those imports don\'t resolve.' },
  guided: { title: 'Add a library', prompt: 'You want Swagger API docs (from the tech stack doc). Which change adds them? A: copy the Swagger jar into src/main/java; B: add the springdoc-openapi dependency to pom.xml and reload Maven; C: import it in BackendApplication.java only.', answer: 'B', hints: ['Libraries are declared, not copied.', 'Maven downloads what pom.xml lists.', 'Answer with the letter about pom.xml.'] },
  practice: { title: 'Why does @Valid do nothing?', prompt: 'You add spring-boot-starter-validation and @Valid, but the running app still accepts blank emails. Most likely cause? A: Maven hasn\'t reloaded and the app wasn\'t restarted; B: validation needs MySQL; C: Java 21 removed validation.', answer: 'A', hints: ['When do pom.xml changes take effect?', 'The JVM only sees libraries present at startup.', 'Answer with the rebuild letter.'] },
  sources: [{ title: 'Spring Boot: Build systems', url: S + 'spring-boot/reference/using/build-systems.html' }],
}),

conceptLesson({
  id: 'component-scan', title: 'Spring only scans its own package and below', file: 'BackendApplication.java',
  explanation: ['@SpringBootApplication scans the package it is in, plus every subpackage, for @Service, @RestController, and so on.', 'A class outside com.cometcarpool.backend is never found.'],
  overview: "Spring only creates beans for classes it can find. It finds them by scanning: starting at the package of the class marked `@SpringBootApplication` (com.cometcarpool.backend) and searching every package below it. A class anywhere else is never found, even if it has `@Service`.",
  goals: [
  "Explain what a package is and what component scanning does.",
  "Predict whether Spring will find a given class.",
  "Diagnose a \"No qualifying bean\" startup error."
],
  diagram: [
  "Scanning from com.cometcarpool.backend",
  [
    [
      "com.cometcarpool.backend",
      "Where BackendApplication lives. Scanning starts here."
    ],
    [
      ".controller.UserController",
      "Below the start package: found."
    ],
    [
      ".service.UserService",
      "Below the start package: found."
    ],
    [
      "com.cometcarpool.util.RideMatcher",
      "Beside backend, not below it: never found."
    ]
  ]
],
  sections: [
  [
    "Packages are folders for classes",
    [
      "A package groups related classes, like a folder. The first line of a Java file, such as `package com.cometcarpool.backend.service;`, says which package the file belongs to.",
      "Packages nest using dots. com.cometcarpool.backend.service is inside com.cometcarpool.backend, which is inside com.cometcarpool. The folders under src/main/java match the package names exactly."
    ]
  ],
  [
    "How scanning works",
    [
      "`@SpringBootApplication` on BackendApplication turns on component scanning. Spring starts at that class's own package and walks through every package beneath it.",
      "In each class it finds, Spring checks for labels like `@Service`, `@Repository`, `@RestController`, and `@Configuration`. Every labeled class becomes a bean.",
      "Anything outside that tree is skipped completely, even with the right label. Spring simply never looks there."
    ]
  ],
  [
    "What it looks like when a class is missed",
    [
      "The code still compiles, because the compiler knows nothing about Spring's scanning. The problem only appears when the app starts.",
      "Spring tries to build a class that asks for the missing one in its constructor, and fails with \"No qualifying bean of type RideMatcher\". The fix is to move the class under com.cometcarpool.backend."
    ]
  ]
],
  walkthrough: [
  "Starting the app with a misplaced RideMatcher",
  [
    [
      "@SpringBootApplication",
      "Spring sees BackendApplication is in com.cometcarpool.backend and starts scanning there."
    ],
    [
      "@Service class RideService",
      "Found under .service. Its constructor asks for a RideMatcher, so Spring needs that bean too."
    ],
    [
      "package com.cometcarpool.util;",
      "RideMatcher lives here, beside backend rather than under it. The scan never visits it, so no bean is made."
    ],
    [
      "No qualifying bean of type RideMatcher",
      "Spring cannot call RideService's constructor without a RideMatcher, so startup stops with this error."
    ],
    [
      "package com.cometcarpool.backend.ride;",
      "Move the file there and update its package line. Restart, and the scan finds it."
    ]
  ]
],
  misconception: "Compiling is not the same as being found. A class can compile perfectly, carry `@Service`, and still never become a bean because it sits outside the scanned packages.",
  takeaway: "Spring scans from BackendApplication's package downward. Put all new backend code under com.cometcarpool.backend.",
  tryIt: 'List the subpackages under src/main/java/com/cometcarpool/backend.',
  deeper: [
  [
    "Why Spring scans instead of a list",
    [
      "Without scanning you would register every class by hand in one big list. Scanning lets you add a class with `@Service` and have it picked up automatically. The price is the rule that it must live under the start package."
    ]
  ],
  [
    "Changing where scanning starts",
    [
      "`@SpringBootApplication(scanBasePackages = \"com.cometcarpool\")` widens the scan. It works, but most projects keep the default and arrange their packages to match, because a wider scan can pick up classes you never meant to include."
    ]
  ],
  [
    "Entities and repositories follow the same rule",
    [
      "By default, JPA looks for `@Entity` classes and Spring Data looks for repository interfaces starting from the same package. An entity outside it fails differently, often with \"Not a managed type\"."
    ]
  ],
  [
    "Reading the full error",
    [
      "Spring Boot usually reports: \"Parameter 0 of constructor in ...RideService required a bean of type ...RideMatcher that could not be found.\" Read it as three facts: who needed it (RideService), which parameter (the first), and what was missing (RideMatcher)."
    ]
  ]
],
  example: 'Read the scanning map on the left, then look at the package line at the top of each CometCarpool file. This is a conceptual checkpoint; no code runs.',
  predict: { prompt: 'A teammate adds @Service class RideMatcher in package com.cometcarpool.util and injects it into RideService. What happens at startup? A: Spring finds it; B: startup fails with "No qualifying bean of type RideMatcher"; C: Maven refuses to compile.', answer: 'B', explanation: 'com.cometcarpool.util is not under com.cometcarpool.backend, so it is never scanned.' },
  guided: { title: 'Fix the missing bean', prompt: 'Which change fixes RideMatcher being missing? A: move it to com.cometcarpool.backend.ride (and update its package line); B: add more @Service annotations; C: make the class public static.', answer: 'A', hints: ['What decides what Spring scans?', 'Get the class under the main package.', 'Answer with the letter that moves it.'] },
  practice: { title: 'Where should Ride code live?', prompt: 'You are adding RideController, RideService, and RideRepository for T7. Where do they belong? A: com.cometcarpool.rides (a new top level); B: under com.cometcarpool.backend (for example .controller, .service, .repository); C: in the default package.', answer: 'B', hints: ['Spring scans from BackendApplication\'s package.', 'Follow the existing folders.', 'Answer with the letter under backend.'] },
  sources: [{ title: 'Spring Boot: Structuring your code', url: S + 'spring-boot/reference/using/structuring-your-code.html' }],
}),

conceptLesson({
  id: 'properties', title: 'application.properties configures the app', file: 'application.properties',
  explanation: ['application.properties holds settings such as the database URL, username, and password.', '${DB_PASSWORD} placeholders read environment variables, keeping secrets out of git.'],
  overview: "application.properties is a settings file Spring reads at startup. Each line is a key, an equals sign, and a value, like the database URL. A value such as `${DB_PASSWORD}` is a placeholder: Spring fills it in from an environment variable, so passwords never have to be committed to git.",
  goals: [
  "Read the key=value lines in application.properties.",
  "Explain what an environment variable is and how `${NAME}` reads one.",
  "Move a secret out of the file and into the environment."
],
  diagram: [
  "spring.datasource.password=${DB_PASSWORD}",
  [
    [
      "Startup",
      "Spring reads application.properties line by line."
    ],
    [
      "${DB_PASSWORD}",
      "It sees a placeholder and looks up DB_PASSWORD in the environment."
    ],
    [
      "Value found",
      "The placeholder is replaced with that value."
    ],
    [
      "Connect",
      "The database connection uses each developer's own password."
    ]
  ]
],
  sections: [
  [
    "Keys and values",
    [
      "Each line is `key=value`. The key names a setting and the value is what it is set to. Dots in a key group related settings, like folders.",
      "`spring.datasource.url`, `.username`, and `.password` tell Spring how to connect to Postgres. `spring.jpa.hibernate.ddl-auto=update` lets Hibernate adjust tables to match your entities, and `show-sql=true` prints each SQL query it runs.",
      "The file lives in src/main/resources, so it is packaged with the app and every teammate gets the same copy from git."
    ]
  ],
  [
    "Placeholders read the environment",
    [
      "An environment variable is a named value set outside your program, in your terminal session or your IDE's run settings. `export DB_PASSWORD=secret` sets one in a terminal.",
      "`${DB_PASSWORD}` in a value means \"use the environment variable DB_PASSWORD here\". Spring swaps in the real value at startup.",
      "`${DB_USER:postgres}` adds a default after the colon: use DB_USER if it is set, and postgres if it is not."
    ]
  ]
],
  walkthrough: [
  "Starting the app with a placeholder password",
  [
    [
      "export DB_PASSWORD=mypass",
      "You set the environment variable in the same terminal you will start the app from."
    ],
    [
      "./mvnw spring-boot:run",
      "The app starts and inherits that terminal's environment variables."
    ],
    [
      "spring.datasource.password=${DB_PASSWORD}",
      "Spring reads the line, sees the placeholder, looks up DB_PASSWORD, and finds \"mypass\"."
    ],
    [
      "Connect to Postgres",
      "The connection uses mypass. The committed file never contained the real password."
    ],
    [
      "A new terminal, no export",
      "Start the app without setting DB_PASSWORD: there is no value and no default, so startup fails while setting up the database connection."
    ]
  ]
],
  misconception: "Removing a password from the file in a later commit does not remove it from git. It stays in the history forever, so keep secrets out of committed files from the start.",
  takeaway: "Settings go in application.properties; secrets come from environment variables through `${NAME}` placeholders.",
  tryIt: 'Find spring.datasource.username in comet-carpool\'s application.properties.',
  deeper: [
  [
    "Which value wins when a setting is defined twice",
    [
      "Spring merges several sources, and environment variables and command-line arguments override the file. Setting the environment variable SPRING_DATASOURCE_URL overrides spring.datasource.url without editing anything: Spring maps dots to underscores and ignores case."
    ]
  ],
  [
    "The exact error for a missing value",
    [
      "With no value and no default, startup fails with a message like \"Could not resolve placeholder 'DB_PASSWORD' in value \\\"${DB_PASSWORD}\\\"\". It names the variable, so the fix is to set it or add a default."
    ]
  ],
  [
    "Profiles: different settings per environment",
    [
      "A file named application-dev.properties is used only when the dev profile is active, for example with `spring.profiles.active=dev`. Teams use profiles to keep local and production settings apart."
    ]
  ],
  [
    "Why CometCarpool's known issue matters",
    [
      "Today the committed file contains a teammate's personal database username (issue #12). Everyone else must edit the file to run the app, and those edits risk being committed. Placeholders with defaults fix both problems."
    ]
  ]
],
  example: 'Open src/backend/src/main/resources/application.properties and read each line. This is a conceptual checkpoint; no code runs.',
  predict: { prompt: 'application.properties says spring.datasource.password=${DB_PASSWORD} and you start the app without setting DB_PASSWORD. What happens? A: startup fails resolving the placeholder or connecting; B: Spring uses an empty password and connects; C: Spring asks you to type it.', answer: 'A', explanation: 'With no value and no default, the placeholder can\'t be resolved, so the datasource can\'t be configured.' },
  guided: { title: 'Get credentials out of git', prompt: 'Which change lets each teammate use their own DB password without editing committed files? A: commit everyone\'s password in comments; B: change the value to ${DB_PASSWORD} and set DB_PASSWORD locally; C: delete the file.', answer: 'B', hints: ['Placeholders read the environment.', 'The committed file should have no personal values.', 'Answer with the placeholder letter.'] },
  practice: { title: 'A default for local dev', prompt: 'You want username to default to postgres when DB_USER isn\'t set. Which line? A: spring.datasource.username=${DB_USER:postgres}; B: spring.datasource.username=DB_USER or postgres; C: spring.datasource.username=$DB_USER.', answer: 'A', hints: ['The default goes after a colon.', 'Syntax: ${NAME:default}.', 'Answer with the colon letter.'] },
  sources: [{ title: 'Spring Boot: Externalized configuration', url: S + 'spring-boot/reference/features/external-config.html' }],
}),

lesson({
  id: 'http-status', title: 'Every response has a status code', file: 'controller/UserController.java',
  explanation: ['The status code tells the client what happened: 200 OK, 201 Created, 400 bad input, 401 not logged in, 403 not allowed, 404 not found, 500 server bug.', 'Pick it deliberately with ResponseEntity.status(...).'],
  overview: 'The React app decides what to show from the status code alone: 201 means "account created", 400 means "fix the form", 404 means "ride not found". A controller must choose the right one.',
  goals: ['Match outcomes to status codes.', 'Return 404 instead of 200 with nothing.'],
  diagram: ['Status families', [['2xx', 'Success: 200, 201'], ['4xx', 'Client\'s fault: 400, 401, 403, 404'], ['5xx', 'Server\'s fault: 500']]],
  sections: [
    ['Common codes', ['Success: 200 OK, 201 Created (after a POST).', 'Client errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict. Server bug: 500.']],
    ['In Spring', ['A plain return value is sent as 200.', 'For anything else, return ResponseEntity.status(HttpStatus.CREATED).body(x) or ResponseEntity.notFound().build().'], 'return ResponseEntity.status(HttpStatus.CREATED).body(user);'],
  ],
  misconception: 'Returning null from a controller gives 200 with an empty body, not 404.',
  takeaway: 'Choose the status on purpose.',
  tryIt: 'Add meaning(403) to the example.',
  example: program('System.out.println(meaning(201));\nSystem.out.println(meaning(404));', { statics: 'static String meaning(int code) {\n    return switch (code) {\n        case 200 -> "OK";\n        case 201 -> "Created";\n        case 400 -> "Bad Request";\n        case 404 -> "Not Found";\n        default -> "Other";\n    };\n}' }),
  predict: src('rest').prediction,
  guided: src('rest').guided,
  practice: {
    title: 'Outcome to status', signature: 'static int statusFor(String outcome)',
    prompt: 'Implement statusFor to map an outcome word to its HTTP status code.',
    description: 'A lookup the service layer could use.', requirements: ['"ok": 200, "created": 201, "invalid": 400, "missing": 404, anything else: 500.'],
    examples: [['statusFor("created")', '201'], ['statusFor("boom")', '500']], constraints: ['Exact, lowercase words.'],
    starter: program('System.out.println(statusFor("created"));', { statics: 'static int statusFor(String outcome) {\n    return 200;\n}' }),
    reference: program('System.out.println(statusFor("created"));', { statics: 'static int statusFor(String outcome) {\n    return switch (outcome) {\n        case "ok" -> 200;\n        case "created" -> 201;\n        case "invalid" -> 400;\n        case "missing" -> 404;\n        default -> 500;\n    };\n}' }),
    tests: checks('eq("ok", 200, Main.statusFor("ok"));\neq("created", 201, Main.statusFor("created"));\neq("invalid", 400, Main.statusFor("invalid"));\neq("missing", 404, Main.statusFor("missing"));\neq("other", 500, Main.statusFor("boom"));'),
    hints: ['A switch on the String works.', 'default covers everything else.', 'case "created" -> 201;'],
  },
  sources: [{ title: 'Spring MVC: ResponseEntity', url: S + 'spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responseentity.html' }],
}),

lesson({
  id: 'json', title: 'Jackson turns objects into JSON', file: 'dto/LoginResponse.java',
  explanation: ['Each getter or record component becomes a JSON key; Strings are quoted, numbers and booleans are not, null is null.', 'The React app reads exactly these keys with Axios.'],
  overview: 'LoginResponse("abc") goes over the wire as `{"token":"abc"}`. Knowing the exact JSON shape helps you wire the frontend and read Postman output.',
  goals: ['Predict the JSON for an object.', 'Quote Strings and leave numbers bare.'],
  diagram: ['UserResponse(1L, "ana@utdallas.edu")', [['id()', '"id":1'], ['email()', '"email":"ana@utdallas.edu"'], ['Result', '{"id":1,"email":"ana@utdallas.edu"}']]],
  sections: [
    ['Rules', ['Keys are always quoted. Strings are quoted. Numbers, true/false, and null are not.', 'A " inside a String is escaped as \\".']],
    ['Controlling it', ['@JsonIgnore skips a field (User.password). A record or DTO controls exactly which keys exist.', '@RequestBody does the reverse: JSON to object.']],
  ],
  misconception: '"3" and 3 aren\'t the same in JSON. One is a String, the other a number.',
  takeaway: 'Strings get quotes; numbers, booleans, and null don\'t.',
  tryIt: 'Call json(null, "b@utdallas.edu") in the example.',
  example: program('System.out.println(json(1L, "ana@utdallas.edu"));', { statics: 'static String json(Long id, String email) {\n    return "{\\"id\\":" + id + ",\\"email\\":\\"" + email + "\\"}";\n}' }),
  predict: { code: program('System.out.println("{\\"ok\\":" + true + ",\\"seats\\":" + 3 + ",\\"note\\":" + null + "}");\nSystem.out.println("[" + 1 + "," + 2 + "]");'), expected: '{"ok":true,"seats":3,"note":null}\n[1,2]\n', explanation: 'Booleans, numbers, and null appear bare. An array is just values in brackets.' },
  guided: {
    title: 'Quote the email', signature: 'static String toJson(Long id, String email)',
    prompt: 'Change toJson so the email value is wrapped in quotes, making the output valid JSON.',
    description: 'The starter writes the email bare.', requirements: ['toJson(1L, "a@utdallas.edu") is {"id":1,"email":"a@utdallas.edu"}.'],
    examples: [['toJson(1L, "a@utdallas.edu")', '{"id":1,"email":"a@utdallas.edu"}'], ['Starter', '{"id":1,"email":a@utdallas.edu}']], constraints: ['No spaces.'],
    starter: program('System.out.println(toJson(1L, "a@utdallas.edu"));', { statics: 'static String toJson(Long id, String email) {\n    return "{\\"id\\":" + id + ",\\"email\\":" + email + "}";\n}' }),
    reference: program('System.out.println(toJson(1L, "a@utdallas.edu"));', { statics: 'static String toJson(Long id, String email) {\n    return "{\\"id\\":" + id + ",\\"email\\":\\"" + email + "\\"}";\n}' }),
    tests: checks('eq("json", "{\\"id\\":1,\\"email\\":\\"a@utdallas.edu\\"}", Main.toJson(1L, "a@utdallas.edu"));'),
    hints: ['A literal quote in Java is \\".', 'Add one before and one after the email.', '",\\"email\\":\\"" + email + "\\"}"'],
  },
  practice: src('rest').practice,
  sources: [{ title: 'Spring MVC: JSON', url: S + 'spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responseentity.html' }],
}),

lesson({
  id: 'controllers', title: 'A controller maps method + path to a handler', file: 'controller/UserController.java',
  explanation: ['@PostMapping("/login") inside @RequestMapping("/api/users") routes POST /api/users/login to one method.', '@PathVariable reads parts of the path, such as the 7 in /api/rides/7.'],
  overview: 'Spring\'s DispatcherServlet looks at each request\'s method and path and calls the matching handler in a @RestController. Build that routing by hand to see what the annotations do.',
  goals: ['Route requests by method and path.', 'Extract an id from the path.'],
  diagram: ['POST /api/users/login', [['@RequestMapping("/api/users")', 'Class prefix'], ['@PostMapping("/login")', 'Method + rest of path'], ['loginUser(...)', 'Handler runs']]],
  sections: [
    ['Annotations', ['@GetMapping, @PostMapping, @PutMapping, @DeleteMapping.', '@GetMapping("/{id}") with a @PathVariable Long id parameter; @RequestParam reads ?to=UTD.'], '@GetMapping("/{id}")\npublic RideResponse get(@PathVariable Long id) { ... }'],
    ['Thin controllers', ['A controller translates HTTP to service calls and back. Rules live in services.', 'UserController calls userService and jwtService and nothing else.']],
  ],
  misconception: 'GET /api/users and POST /api/users are different routes, even though the path is the same.',
  takeaway: 'Method + path picks the handler.',
  tryIt: 'Add a DELETE branch to the example.',
  example: src('rest').example.code,
  predict: { code: program('System.out.println(route("GET", "/api/users"));\nSystem.out.println(route("POST", "/api/users"));\nSystem.out.println(route("DELETE", "/api/users"));', { statics: 'static String route(String method, String path) {\n    if (path.equals("/api/users") && method.equals("GET")) return "getAllUsers";\n    if (path.equals("/api/users") && method.equals("POST")) return "createUser";\n    return "405";\n}' }), expected: 'getAllUsers\ncreateUser\n405\n', explanation: 'Same path, different methods, different handlers. DELETE has no handler.' },
  guided: {
    title: 'Route the login', signature: 'static String route(String method, String path)',
    prompt: 'Change route so POST /api/users/login maps to loginUser instead of 404.',
    description: 'Login is missing from the router.', requirements: ['POST /api/users/login: "loginUser".', 'Keep the other routes.'],
    examples: [['route("POST", "/api/users/login")', '"loginUser"'], ['route("GET", "/api/users/login")', '"404"']], constraints: ['Match method and path exactly.'],
    starter: program('System.out.println(route("POST", "/api/users/login"));', { statics: 'static String route(String method, String path) {\n    if (method.equals("POST") && path.equals("/api/users")) return "createUser";\n    if (method.equals("GET") && path.equals("/api/users")) return "getAllUsers";\n    return "404";\n}' }),
    reference: program('System.out.println(route("POST", "/api/users/login"));', { statics: 'static String route(String method, String path) {\n    if (method.equals("POST") && path.equals("/api/users")) return "createUser";\n    if (method.equals("POST") && path.equals("/api/users/login")) return "loginUser";\n    if (method.equals("GET") && path.equals("/api/users")) return "getAllUsers";\n    return "404";\n}' }),
    tests: checks('eq("login", "loginUser", Main.route("POST", "/api/users/login"));\neq("get login", "404", Main.route("GET", "/api/users/login"));\neq("create", "createUser", Main.route("POST", "/api/users"));'),
    hints: ['Add one more if.', 'Check both method and path.', 'if (method.equals("POST") && path.equals("/api/users/login")) return "loginUser";'],
  },
  practice: {
    title: 'Read the path id', signature: 'static Long pathId(String path, String prefix)',
    prompt: 'Implement pathId to return the number after the prefix (like @PathVariable), or null when the path doesn\'t match or isn\'t a number.',
    description: '/api/rides/7 with prefix /api/rides/ gives 7.', requirements: ['Path must start with prefix.', 'The rest must parse as a Long; else null.'],
    examples: [['pathId("/api/rides/7", "/api/rides/")', '7'], ['pathId("/api/rides/abc", "/api/rides/")', 'null']], constraints: ['Return null, don\'t throw.'],
    starter: program('System.out.println(pathId("/api/rides/7", "/api/rides/"));', { statics: 'static Long pathId(String path, String prefix) {\n    return null;\n}' }),
    reference: program('System.out.println(pathId("/api/rides/7", "/api/rides/"));', { statics: 'static Long pathId(String path, String prefix) {\n    if (!path.startsWith(prefix)) return null;\n    try {\n        return Long.parseLong(path.substring(prefix.length()));\n    } catch (NumberFormatException e) {\n        return null;\n    }\n}' }),
    tests: checks('eq("7", 7L, Main.pathId("/api/rides/7", "/api/rides/"));\neq("abc", null, Main.pathId("/api/rides/abc", "/api/rides/"));\neq("other", null, Main.pathId("/api/users/7", "/api/rides/"));\neq("empty", null, Main.pathId("/api/rides/", "/api/rides/"));'),
    hints: ['Check startsWith first.', 'substring(prefix.length()) is the rest; parse it in a try.', 'return Long.parseLong(path.substring(prefix.length()));'],
  },
  sources: [{ title: 'Spring MVC: Annotated controllers', url: S + 'spring-framework/reference/web/webmvc/mvc-controller.html' }],
}),

trimmed('errors', 'One handler turns exceptions into responses', [0, 2]),

conceptLesson({
  id: 'entities', title: '@Entity maps a class to a table', file: 'model/User.java',
  explanation: ['@Entity makes each User object a row in a table; each field becomes a column.', '@Id marks the primary key; @GeneratedValue(IDENTITY) lets Postgres number it.'],
  overview: 'User is @Entity @Table(name = "users"). Hibernate creates `users(id, email, password, first_name, last_name, role)`. save(user) becomes INSERT; findByEmail becomes SELECT ... WHERE email = ?.',
  goals: ['Translate annotations into columns.', 'Read the SQL Hibernate prints.'],
  diagram: ['class User to table users', [['@Id Long id', 'id bigint, generated'], ['String firstName', 'first_name varchar'], ['save(user)', 'INSERT INTO users ...']]],
  sections: [
    ['Mapping', ['@Table(name = "users") because "user" is reserved in Postgres.', 'camelCase fields become snake_case columns. JPA needs the no-arg constructor.']],
    ['Seeing SQL', ['spring.jpa.show-sql=true prints every statement.', 'ddl-auto=update alters tables from entities; real projects use migrations (Flyway, known issue #11).']],
  ],
  misconception: 'The entity isn\'t the table. Hibernate generates SQL from it, and the table can drift if you rely only on ddl-auto.',
  takeaway: 'One entity class, one table; one object, one row.',
  tryIt: 'Turn on show-sql, register a user, and read the INSERT.',
  example: 'Open model/User.java in comet-carpool and match each annotation to the diagram. This is a conceptual checkpoint; no code runs.',
  predict: { prompt: 'User has a field String firstName. What column does Hibernate create by default? A: first_name; B: FIRSTNAME only; C: no column unless you add @Column.', answer: 'A', explanation: 'Spring Boot\'s default naming turns camelCase into snake_case, and every field is mapped unless marked @Transient.' },
  guided: { title: 'Name the table', prompt: 'Which change stores Ride entities in a table called rides? A: add @Table(name = "rides") under @Entity; B: rename the Java file to rides.java; C: add a comment // table: rides.', answer: 'A', hints: ['Look at how User names its table.', 'It is an annotation.', 'Answer with the @Table letter.'] },
  practice: { title: 'Who fills the id?', prompt: 'With @GeneratedValue(strategy = GenerationType.IDENTITY), when does a new User get its id? A: when you call new User(); B: when save() inserts the row and Postgres assigns it; C: never; you must set it.', answer: 'B', hints: ['IDENTITY means the database numbers rows.', 'Before saving, id is null.', 'Answer with the save letter.'] },
  sources: [{ title: 'Spring Data JPA: Entity persistence', url: S + 'spring-data/jpa/reference/jpa/entity-persistence.html' }],
}),

conceptLesson({
  id: 'constraints', title: 'Only the database can guarantee uniqueness', file: 'model/User.java',
  explanation: ['A Java check like existsByEmail can be raced by two simultaneous requests.', 'A UNIQUE constraint makes Postgres reject the second insert.'],
  overview: 'saveUser checks existsByEmail, then saves. Two sign-ups at the same instant can both pass the check, so you get duplicates (known issue #8). `@Column(unique = true)` or a migration adding UNIQUE closes the gap.',
  goals: ['Explain the check-then-insert race.', 'Choose a schema constraint.'],
  diagram: ['Two sign-ups, same email', [['Both run existsByEmail', 'Both see false'], ['Both INSERT', 'Without UNIQUE: duplicates'], ['With UNIQUE', 'Second INSERT fails, so return 409']]],
  sections: [
    ['The race', ['Between the check and the insert, another request can slip in.', 'No amount of Java ifs closes that gap.']],
    ['The fix', ['@Column(unique = true, nullable = false) on email, or a Flyway migration.', 'Catch DataIntegrityViolationException and answer 409 Conflict.']],
  ],
  misconception: 'Keeping existsByEmail doesn\'t make the constraint unnecessary. The check gives a friendly message; the constraint gives the guarantee.',
  takeaway: 'Rules that must always hold belong in the schema.',
  tryIt: 'Find email in User.java and decide which annotation to add.',
  example: 'Read the race on the left, then look at saveUser in UserService.java. This is a conceptual checkpoint; no code runs.',
  predict: { prompt: 'Two sign-ups for ana@utdallas.edu arrive at the same instant, with no UNIQUE constraint. What can happen? A: both pass existsByEmail and two rows are saved; B: Java blocks the second request automatically; C: Hibernate merges them.', answer: 'A', explanation: 'Both checks can run before either insert commits.' },
  guided: { title: 'Make duplicates impossible', prompt: 'Which change makes duplicate emails impossible even under concurrency? A: add @Column(unique = true, nullable = false) to email (or a UNIQUE migration); B: make the field public; C: add @JsonIgnore.', answer: 'A', hints: ['The guarantee lives where the rows live.', 'UNIQUE rejects the second INSERT.', 'Answer with the unique letter.'] },
  practice: { title: 'Answer the violation', prompt: 'With the constraint in place, the second insert throws DataIntegrityViolationException. What should the API return? A: 500 with the SQL error; B: 409 Conflict with "A user with this email already exists."; C: 200 and ignore it.', answer: 'B', hints: ['It\'s a conflict with existing data.', 'Never leak SQL text.', 'Answer with the 409 letter.'] },
  sources: [{ title: 'Spring Data JPA: Entity persistence', url: S + 'spring-data/jpa/reference/jpa/entity-persistence.html' }],
}),

conceptLesson({
  id: 'relationships', title: '@ManyToOne links a row to its parent', file: 'model/Ride.java',
  explanation: ['Many rides belong to one driver: @ManyToOne User driver stores a driver_id foreign key.', 'Put the link on the "many" side.'],
  overview: 'For T7, a Ride needs its driver. `@ManyToOne(optional = false) private User driver;` adds a driver_id column pointing at users.id. A RideRequest has two such links: rider and ride.',
  goals: ['Pick the right side for a foreign key.', 'Model RideRequest\'s two links.'],
  diagram: ['rides.driver_id to users.id', [['User (one)', 'Ana, id 1'], ['Ride (many)', 'driver_id = 1, 1, 1'], ['@ManyToOne', 'On Ride.driver']]],
  sections: [
    ['Foreign keys', ['The many side stores the id of the one side.', '@ManyToOne(optional = false) adds NOT NULL.']],
    ['Requests', ['RideRequest: @ManyToOne User rider and @ManyToOne Ride ride.', 'Avoid lists inside User unless you need them; query from the many side instead.']],
  ],
  misconception: 'Copying the driver\'s email into Ride isn\'t a relationship. It goes stale when the email changes.',
  takeaway: 'The many side holds the foreign key.',
  tryIt: 'Sketch the rides and ride_requests columns on paper.',
  example: 'Read the diagram, then docs/wiki/data-model.md in comet-carpool. This is a conceptual checkpoint; no code runs.',
  predict: { prompt: 'Ride has @ManyToOne User driver. Which column appears in rides? A: driver_id referencing users.id; B: a copy of every driver field; C: rides_id in users.', answer: 'A', explanation: 'The many side stores one foreign key column.' },
  guided: { title: 'Map a ride\'s driver', prompt: 'Which change gives Ride its driver? A: add private String driverEmail; B: add @ManyToOne(optional = false) private User driver; C: add @OneToOne private List<User> drivers.', answer: 'B', hints: ['Many rides, one driver.', 'The annotation names the many-to-one direction.', 'Answer with the @ManyToOne letter.'] },
  practice: { title: 'Model a ride request', prompt: 'A RideRequest is one rider asking for one ride. Which fields? A: @ManyToOne User rider and @ManyToOne Ride ride; B: String riderName and String rideName; C: @OneToMany List<Ride> rides.', answer: 'A', hints: ['Each request points to one rider and one ride.', 'Both are many-to-one.', 'Answer with the two @ManyToOne letter.'] },
  sources: [{ title: 'Spring Data JPA: Entity persistence', url: S + 'spring-data/jpa/reference/jpa/entity-persistence.html' }],
}),

lesson({
  id: 'repository-save', title: 'save inserts new rows and updates existing ones', file: 'repository/UserRepository.java',
  explanation: ['repository.save(entity) inserts when the id is null and updates when it isn\'t.', 'save returns the stored entity, now with its id.'],
  overview: 'UserRepository extends JpaRepository<User, Long>, so it has save, findById, findAll, and deleteById for free. save is the one that decides between INSERT and UPDATE by looking at the id.',
  goals: ['Implement save\'s insert-or-update rule.', 'Predict ids and row counts.'],
  diagram: ['save(user)', [['id == null?', 'INSERT, assign next id'], ['id != null', 'UPDATE that row'], ['return', 'The stored entity']]],
  sections: [
    ['Free methods', ['save, saveAll, findById (Optional), findAll, count, deleteById.', 'The generic types say which entity and which id type.'], 'interface UserRepository extends JpaRepository<User, Long> {}'],
    ['Insert vs update', ['A new object with a null id is inserted. Saving it again updates it.', 'Use the returned entity; it carries the id.']],
  ],
  misconception: 'save doesn\'t always insert. Saving an object that has an id updates its row.',
  takeaway: 'null id inserts; existing id updates.',
  tryIt: 'Save a third user and print findAll().size().',
  example: src('repositories').example.code,
  predict: { code: program('UserRepository repo = new UserRepository();\nUser a = repo.save(new User("a@utdallas.edu"));\nrepo.save(a);\nrepo.save(new User("b@utdallas.edu"));\nSystem.out.println(repo.findAll().size() + " " + a.id);', { types: userRepo + '\n\nclass UserRepository {\n    private final Map<Long, User> rows = new LinkedHashMap<>();\n    private long nextId = 1;\n\n    User save(User u) {\n        if (u.id == null) u.id = nextId++;\n        rows.put(u.id, u);\n        return u;\n    }\n\n    List<User> findAll() { return new ArrayList<>(rows.values()); }\n}' }), expected: '2 1\n', explanation: 'Saving a again updates row 1 instead of adding one. b becomes row 2.' },
  guided: {
    title: 'Don\'t duplicate on update', signature: 'User save(User u)',
    prompt: 'Change save so it assigns a new id only when the user\'s id is null; right now every save creates a new row.',
    description: 'Updating an email duplicates the user.', requirements: ['null id: assign nextId++.', 'Existing id: replace that row.'],
    examples: [['save(new), save(same)', 'one row'], ['ids', '1, then 2 for the next new user']], constraints: ['Keep the LinkedHashMap.'],
    starter: program('System.out.println("see tests");', { types: userRepo + '\n\nclass UserRepository {\n    private final Map<Long, User> rows = new LinkedHashMap<>();\n    private long nextId = 1;\n\n    User save(User u) {\n        u.id = nextId++;\n        rows.put(u.id, u);\n        return u;\n    }\n\n    List<User> findAll() { return new ArrayList<>(rows.values()); }\n}' }),
    reference: program('System.out.println("see tests");', { types: userRepo + '\n\nclass UserRepository {\n    private final Map<Long, User> rows = new LinkedHashMap<>();\n    private long nextId = 1;\n\n    User save(User u) {\n        if (u.id == null) u.id = nextId++;\n        rows.put(u.id, u);\n        return u;\n    }\n\n    List<User> findAll() { return new ArrayList<>(rows.values()); }\n}' }),
    tests: checks('UserRepository r = new UserRepository();\nUser a = r.save(new User("a@utdallas.edu"));\na.email = "a2@utdallas.edu";\nr.save(a);\neq("one row", 1, r.findAll().size());\neq("id kept", 1L, a.id);\neq("next id", 2L, r.save(new User("b@utdallas.edu")).id);'),
    hints: ['Only new users need an id.', 'Check u.id == null.', 'if (u.id == null) u.id = nextId++;'],
  },
  practice: {
    title: 'Save immutable rides', signature: 'Ride save(Ride ride)',
    prompt: 'Implement RideRepository.save for an immutable record: give new rides the next id by building a new Ride, and replace rides that already have one.',
    description: 'Records can\'t be changed, so build a copy with the id.', requirements: ['null id: new Ride(nextId++, ...); store and return it.', 'Existing id: store and return as is.'],
    examples: [['save(new Ride(null, "Ana", "UTD", 3))', 'Ride[id=1, ...]'], ['save(new Ride(1L, "Ana", "UTD", 0))', 'replaces ride 1']], constraints: ['Use LinkedHashMap<Long, Ride>.'],
    starter: program('System.out.println(new RideRepository().save(new Ride(null, "Ana", "UTD", 3)));', { types: rideRec + '\n\nclass RideRepository {\n    Ride save(Ride ride) { return ride; }\n    List<Ride> findAll() { return List.of(); }\n}' }),
    reference: program('System.out.println(new RideRepository().save(new Ride(null, "Ana", "UTD", 3)));', { types: rideRec + '\n\nclass RideRepository {\n    private final Map<Long, Ride> rows = new LinkedHashMap<>();\n    private long nextId = 1;\n\n    Ride save(Ride ride) {\n        Ride stored = ride.id() == null ? new Ride(nextId++, ride.driver(), ride.destination(), ride.seats()) : ride;\n        rows.put(stored.id(), stored);\n        return stored;\n    }\n\n    List<Ride> findAll() { return new ArrayList<>(rows.values()); }\n}' }),
    tests: checks('RideRepository r = new RideRepository();\nRide a = r.save(new Ride(null, "Ana", "UTD", 3));\nRide b = r.save(new Ride(null, "Ben", "Plano", 2));\neq("ids", List.of(1L, 2L), List.of(a.id(), b.id()));\nr.save(new Ride(1L, "Ana", "UTD", 0));\neq("count", 2, r.findAll().size());\neq("updated", 0, r.findAll().get(0).seats());'),
    hints: ['You need a map and a counter.', 'Build a new Ride carrying the id for new rides.', 'Ride stored = ride.id() == null ? new Ride(nextId++, ride.driver(), ride.destination(), ride.seats()) : ride;'],
  },
  sources: [{ title: 'Spring Data: Repositories', url: S + 'spring-data/jpa/reference/repositories/core-concepts.html' }],
}),

lesson({
  id: 'derived-queries', title: 'Method names become queries', file: 'repository/UserRepository.java',
  explanation: ['Spring Data reads a method name like findByDestinationAndSeatsGreaterThan and writes the WHERE clause.', 'existsByEmailIgnoreCase fixes known issue #9 at the query level.'],
  overview: 'Declaring `boolean existsByEmail(String email);` in UserRepository is enough; Spring writes `select count(*) > 0 from users where email = ?`. The name is the query.',
  goals: ['Read method names as WHERE clauses.', 'Implement a derived query by hand.'],
  diagram: ['findByDestinationAndSeatsGreaterThan', [['findBy', 'SELECT ... WHERE'], ['Destination', 'destination = ?'], ['AndSeatsGreaterThan', 'AND seats > ?']]],
  sections: [
    ['Keywords', ['And, Or, GreaterThan, LessThan, Between, After, Before, IgnoreCase, Containing, OrderBy...Asc.', 'Return types: List, Optional, boolean (existsBy), long (countBy).'], 'List<Ride> findByDestinationAndSeatsGreaterThan(String destination, int seats);'],
    ['When names get long', ['Use @Query("select r from Ride r where ...") for complex searches (Q11 filters).', 'Prefer Optional<User> findByEmail over a nullable return.']],
  ],
  misconception: 'Derived queries are exact matches unless the name says IgnoreCase or Containing.',
  takeaway: 'Name the method after the WHERE clause you want.',
  tryIt: 'Write the name for "rides by driver id, earliest first".',
  example: program('List<Ride> rides = List.of(new Ride(1L, "Ana", "UTD", 3), new Ride(2L, "Ben", "UTD", 0));\nSystem.out.println(findByDestination(rides, "UTD").size());', { types: rideRec, statics: 'static List<Ride> findByDestination(List<Ride> rows, String destination) {\n    List<Ride> out = new ArrayList<>();\n    for (Ride r : rows) if (r.destination().equals(destination)) out.add(r);\n    return out;\n}' }),
  predict: src('repositories').prediction,
  guided: src('repositories').guided,
  practice: {
    title: 'Destination and seats', signature: 'List<Ride> findByDestinationAndSeatsGreaterThan(String destination, int seats)',
    prompt: 'Implement findByDestinationAndSeatsGreaterThan: exact destination match and more than the given seats, in insertion order.',
    description: 'The query behind ride search.', requirements: ['destination equals exactly.', 'seats strictly greater.', 'Insertion order.'],
    examples: [['("UTD", 0)', 'UTD rides with 1+ seats'], ['("utd", 0)', '[] (exact match)']], constraints: ['save is provided.'],
    starter: program('System.out.println("see tests");', { types: rideRec + '\n\nclass RideRepository {\n    final List<Ride> rows = new ArrayList<>();\n\n    void save(Ride r) { rows.add(r); }\n\n    List<Ride> findByDestinationAndSeatsGreaterThan(String destination, int seats) {\n        return rows;\n    }\n}' }),
    reference: program('System.out.println("see tests");', { types: rideRec + '\n\nclass RideRepository {\n    final List<Ride> rows = new ArrayList<>();\n\n    void save(Ride r) { rows.add(r); }\n\n    List<Ride> findByDestinationAndSeatsGreaterThan(String destination, int seats) {\n        List<Ride> out = new ArrayList<>();\n        for (Ride r : rows) if (r.destination().equals(destination) && r.seats() > seats) out.add(r);\n        return out;\n    }\n}' }),
    tests: checks('RideRepository r = new RideRepository();\nRide a = new Ride(1L, "Ana", "UTD", 3), b = new Ride(2L, "Ben", "Plano", 2), c = new Ride(3L, "Cam", "UTD", 1);\nr.save(a); r.save(b); r.save(c);\neq(">0", List.of(a, c), r.findByDestinationAndSeatsGreaterThan("UTD", 0));\neq(">1", List.of(a), r.findByDestinationAndSeatsGreaterThan("UTD", 1));\neq("case", List.of(), r.findByDestinationAndSeatsGreaterThan("utd", 0));'),
    hints: ['Loop and keep matches.', 'Both conditions with &&.', 'if (r.destination().equals(destination) && r.seats() > seats) out.add(r);'],
  },
  sources: [{ title: 'Spring Data JPA: Query methods', url: S + 'spring-data/jpa/reference/jpa/query-methods.html' }],
}),

trimmed('validation', 'Validate input at the edge, collecting every error', [0, 1]),

lesson({
  id: 'hashing', title: 'A hash is a one-way fingerprint', file: 'service/UserService.java',
  explanation: ['A hash turns a password into a fixed-length fingerprint that can\'t be turned back.', 'To check a password, hash the attempt and compare fingerprints.'],
  overview: 'CometCarpool never stores raw passwords. It stores a hash, and login hashes the attempt and compares. There\'s no "decrypt"; matching fingerprints is the whole check.',
  goals: ['Explain hashing vs. encryption.', 'Verify a password by re-hashing.'],
  diagram: ['Login check', [['Stored', 'sha256("secret123")'], ['Attempt', 'sha256(typed password)'], ['Equal?', 'Correct password']]],
  sections: [
    ['One-way', ['SHA-256 maps any text to 64 hex characters; one changed letter changes everything.', 'You can\'t recover the input from the output.']],
    ['Verify by re-hashing', ['Compare hash(attempt) with the stored hash.', 'Production uses BCrypt, which is slow on purpose; SHA-256 here is only for understanding.'], 'boolean ok = sha256(attempt).equals(storedHash);'],
  ],
  misconception: 'Hashing isn\'t encryption. There is no key that turns it back.',
  takeaway: 'Store fingerprints; compare fingerprints.',
  tryIt: 'Hash "secret123" and "Secret123".',
  example: src('hashing').example.code,
  predict: { code: program('System.out.println(sha256("pw").equals(sha256("pw")));\nSystem.out.println(sha256("pw").equals(sha256("Pw")));\nSystem.out.println(sha256("x").length());', { imports: HASH, statics: sha }), expected: 'true\nfalse\n64\n', explanation: 'Same input, same hash. One capital letter changes it. SHA-256 hex is always 64 characters.' },
  guided: {
    title: 'Compare hashes, not raw text', signature: 'static boolean checkPassword(String attempt, String storedHash)',
    prompt: 'Change checkPassword so it hashes the attempt before comparing it with the stored hash.',
    description: 'The starter compares raw text with a hash, so it never matches.', requirements: ['Return sha256(attempt).equals(storedHash).'],
    examples: [['checkPassword("secret123", sha256("secret123"))', 'true'], ['checkPassword("nope", sha256("secret123"))', 'false']], constraints: ['Use the sha256 helper.'],
    starter: program('System.out.println(checkPassword("secret123", sha256("secret123")));', { imports: HASH, statics: sha + '\n\nstatic boolean checkPassword(String attempt, String storedHash) {\n    return attempt.equals(storedHash);\n}' }),
    reference: program('System.out.println(checkPassword("secret123", sha256("secret123")));', { imports: HASH, statics: sha + '\n\nstatic boolean checkPassword(String attempt, String storedHash) {\n    return sha256(attempt).equals(storedHash);\n}' }),
    tests: checks('String h = Main.sha256("secret123");\neq("right", true, Main.checkPassword("secret123", h));\neq("wrong", false, Main.checkPassword("nope", h));'),
    hints: ['Both sides must be hashes.', 'Hash the attempt.', 'return sha256(attempt).equals(storedHash);'],
  },
  practice: {
    title: 'An email fingerprint', signature: 'static String fingerprint(String email)',
    prompt: 'Implement fingerprint to return the first 12 hex characters of the SHA-256 of the normalized (trimmed, lowercased) email.',
    description: 'Lets logs mention a user without printing the email.', requirements: ['Normalize first, then hash, then take 12 characters.'],
    examples: [['fingerprint(" Ana@UTDallas.edu ") == fingerprint("ana@utdallas.edu")', 'true'], ['length', '12']], constraints: ['Use sha256.'],
    starter: program('System.out.println(fingerprint("ana@utdallas.edu"));', { imports: HASH, statics: sha + '\n\nstatic String fingerprint(String email) {\n    return email;\n}' }),
    reference: program('System.out.println(fingerprint("ana@utdallas.edu"));', { imports: HASH, statics: sha + '\n\nstatic String fingerprint(String email) {\n    return sha256(email.trim().toLowerCase()).substring(0, 12);\n}' }),
    tests: checks('String want = HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest("ana@utdallas.edu".getBytes(java.nio.charset.StandardCharsets.UTF_8))).substring(0, 12);\neq("clean", want, Main.fingerprint("ana@utdallas.edu"));\neq("messy", want, Main.fingerprint(" Ana@UTDallas.edu "));\neq("length", 12, Main.fingerprint("b@utdallas.edu").length());'),
    hints: ['Normalize, then hash.', 'substring(0, 12) keeps the first 12.', 'return sha256(email.trim().toLowerCase()).substring(0, 12);'],
  },
  sources: [{ title: 'Spring Security: Password storage', url: S + 'spring-security/reference/features/authentication/password-storage.html' }],
}),

lesson({
  id: 'salts', title: 'A salt makes equal passwords hash differently', file: 'config/SecurityConfig.java',
  explanation: ['A random per-user salt is mixed in before hashing, so two users with the same password get different hashes.', 'The salt is stored next to the hash; BCrypt does this for you.'],
  overview: 'Without salt, everyone using password123 has the same hash and one precomputed table cracks them all. BCrypt\'s output `$2a$10$<salt><hash>` carries its own salt; matches reads it back out.',
  goals: ['Store salt and hash together.', 'Verify using the stored salt.'],
  diagram: ['encode("pw")', [['Pick salt', 'a1'], ['Hash salt + pw', 'sha256("a1pw")'], ['Store', '"a1:<hash>"']]],
  sections: [
    ['Why salt', ['Same password, different salt, different hash.', 'The salt isn\'t secret; its job is uniqueness.']],
    ['Verifying', ['Split the stored value, hash salt + attempt, compare.', 'BCryptPasswordEncoder.matches does exactly this.'], '@Bean\npublic PasswordEncoder passwordEncoder() {\n    return new BCryptPasswordEncoder();\n}'],
  ],
  misconception: 'You don\'t need to keep the salt secret. Uniqueness, not secrecy, is the point.',
  takeaway: 'Store salt:hash; re-hash with that salt to check.',
  tryIt: 'Encode "pw" with salts s1 and s2 and compare.',
  example: program('String stored = "s1:" + sha256("s1pw");\nSystem.out.println(stored.substring(0, 3));\nSystem.out.println(stored.length());', { imports: HASH, statics: sha }),
  predict: src('hashing').prediction,
  guided: src('hashing').guided,
  practice: src('hashing').practice,
  sources: [{ title: 'Spring Security: Password storage', url: S + 'spring-security/reference/features/authentication/password-storage.html' }],
}),

lesson({
  id: 'jwt-structure', title: 'A JWT is readable JSON plus a signature', file: 'security/JwtService.java',
  explanation: ['A JWT is header.payload.signature; header and payload are Base64URL-encoded JSON anyone can read.', 'The signature is an HMAC of the first two parts using the server\'s secret.'],
  overview: 'JwtService.generateToken builds `{"sub":email,"iat":...,"exp":...}`, encodes it, and signs it. Paste a token into a decoder and you\'ll see the payload. It is signed, not encrypted.',
  goals: ['Split and decode a token.', 'Build one from header, payload, and signature.'],
  diagram: ['eyJ...  .  eyJ...  .  sig', [['Header', '{"alg":"HS256","typ":"JWT"}'], ['Payload', '{"sub":"ana@...","exp":...}'], ['Signature', 'HMAC(secret, header.payload)']]],
  sections: [
    ['Parts', ['Split on "." to get three parts. Decode the first two with Base64.getUrlDecoder().', 'Never put secrets in claims; anyone can read them.']],
    ['Building', ['token = b64(header) + "." + b64(payload) + "." + sign(those two, secret).', 'jjwt\'s builder does exactly this in compact().'], 'Jwts.builder().subject(email).expiration(exp).signWith(key).compact();'],
  ],
  misconception: 'Base64 isn\'t encryption. It is a reversible encoding.',
  takeaway: 'Readable claims, tamper-evident signature.',
  tryIt: 'Decode parts[0] in the example.',
  example: src('jwt').example.code,
  predict: { code: program('String t = b64("{\\"alg\\":\\"HS256\\"}") + "." + b64("{\\"sub\\":\\"ana\\"}") + ".sig";\nString[] p = t.split("\\\\.");\nSystem.out.println(unb64(p[0]));\nSystem.out.println(unb64(p[1]));\nSystem.out.println(p[2]);', { imports: JWT, statics: jwtHelpers }), expected: '{"alg":"HS256"}\n{"sub":"ana"}\nsig\n', explanation: 'The first two parts decode straight back to their JSON; the third is the signature.' },
  guided: {
    title: 'Read the right part', signature: 'static String payloadOf(String token)',
    prompt: 'Change payloadOf to decode the second part of the token (the payload) instead of the first.',
    description: 'The starter returns the header.', requirements: ['Return unb64(parts[1]).'],
    examples: [['payloadOf(token for ana)', '{"sub":"ana"}'], ['Starter', '{"alg":"HS256"}']], constraints: ['Use split("\\\\.").'],
    starter: program('System.out.println(payloadOf(b64("{\\"alg\\":\\"HS256\\"}") + "." + b64("{\\"sub\\":\\"ana\\"}") + ".x"));', { imports: JWT, statics: jwtHelpers + '\n\nstatic String payloadOf(String token) {\n    return unb64(token.split("\\\\.")[0]);\n}' }),
    reference: program('System.out.println(payloadOf(b64("{\\"alg\\":\\"HS256\\"}") + "." + b64("{\\"sub\\":\\"ana\\"}") + ".x"));', { imports: JWT, statics: jwtHelpers + '\n\nstatic String payloadOf(String token) {\n    return unb64(token.split("\\\\.")[1]);\n}' }),
    tests: checks('String t = Main.b64("{\\"alg\\":\\"HS256\\"}") + "." + Main.b64("{\\"sub\\":\\"ben\\"}") + ".x";\neq("payload", "{\\"sub\\":\\"ben\\"}", Main.payloadOf(t));'),
    hints: ['Parts are header, payload, signature.', 'Index 1 is the payload.', 'return unb64(token.split("\\\\.")[1]);'],
  },
  practice: src('jwt').practice,
  sources: [{ title: 'RFC 7519: JSON Web Token', url: 'https://www.rfc-editor.org/rfc/rfc7519' }],
}),

lesson({
  id: 'jwt-verify', title: 'Verify a token\'s signature before trusting it', file: 'security/JwtService.java',
  explanation: ['To verify, recompute the signature over header.payload with your secret and compare; then check exp.', 'Known issue #1: CometCarpool never verifies tokens yet.'],
  overview: 'A forged payload ({"sub":"admin"}) produces a different signature, and a token signed with another key won\'t match. Only after the signature checks out may you trust sub, and only if exp hasn\'t passed.',
  goals: ['Recompute and compare a signature.', 'Reject expired tokens.'],
  diagram: ['verify(token)', [['Split', 'header, payload, sig'], ['sign(header.payload)', 'Equal to sig?'], ['exp > now?', 'Then trust sub']]],
  sections: [
    ['Signature first', ['Compare with MessageDigest.isEqual to avoid timing leaks.', 'Any change to header or payload breaks the match.']],
    ['Then expiry', ['Reject when now >= exp.', 'jjwt: Jwts.parser().verifyWith(key).build().parseSignedClaims(token) does both and throws on failure.'], 'Claims c = Jwts.parser().verifyWith(key).build()\n    .parseSignedClaims(token).getPayload();'],
  ],
  misconception: 'Decoding a token isn\'t verifying it. Anyone can make a token that decodes.',
  takeaway: 'Signature, then expiry, then trust.',
  tryIt: 'Change one letter of the payload and re-check.',
  example: program('String body = "h.p";\nString sig = sign(body, "k");\nSystem.out.println(sign("h.p", "k").equals(sig) ? "valid" : "rejected");\nSystem.out.println(sign("h.q", "k").equals(sig) ? "valid" : "rejected");', { imports: JWT, statics: jwtHelpers }),
  predict: src('jwt').prediction,
  guided: src('jwt').guided,
  practice: {
    title: 'Signature check', signature: 'static boolean signatureValid(String token, String secret)',
    prompt: 'Implement signatureValid: split into exactly three parts and compare the recomputed signature with the third part.',
    description: 'The first half of verification.', requirements: ['Not three parts: false.', 'Otherwise compare sign(p0 + "." + p1, secret) with p2 using MessageDigest.isEqual.'],
    examples: [['valid token, right secret', 'true'], ['tampered payload', 'false']], constraints: ['Use the sign helper.'],
    starter: program('System.out.println(signatureValid("a.b.c", "k"));', { imports: JWT, statics: jwtHelpers + '\n\nstatic boolean signatureValid(String token, String secret) {\n    return true;\n}' }),
    reference: program('System.out.println(signatureValid("a.b.c", "k"));', { imports: JWT, statics: jwtHelpers + '\n\nstatic boolean signatureValid(String token, String secret) {\n    String[] p = token.split("\\\\.");\n    if (p.length != 3) return false;\n    String expected = sign(p[0] + "." + p[1], secret);\n    return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), p[2].getBytes(StandardCharsets.UTF_8));\n}' }),
    tests: checks('String body = Main.b64("{\\"alg\\":\\"HS256\\"}") + "." + Main.b64("{\\"sub\\":\\"ana\\"}");\nString t = body + "." + Main.sign(body, "k");\neq("valid", true, Main.signatureValid(t, "k"));\neq("wrong key", false, Main.signatureValid(t, "other"));\nString forged = Main.b64("{\\"alg\\":\\"HS256\\"}") + "." + Main.b64("{\\"sub\\":\\"admin\\"}") + "." + t.split("\\\\.")[2];\neq("forged", false, Main.signatureValid(forged, "k"));\neq("two parts", false, Main.signatureValid("a.b", "k"));'),
    hints: ['Split on "\\\\." and check the length.', 'Recompute over the first two parts.', 'MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), p[2].getBytes(StandardCharsets.UTF_8))'],
  },
  sources: [{ title: 'RFC 7519: JSON Web Token', url: 'https://www.rfc-editor.org/rfc/rfc7519' }],
}),

lesson({
  id: 'bearer', title: 'Tokens travel as "Authorization: Bearer ..."', file: 'config/SecurityConfig.java',
  explanation: ['The client sends its token in the Authorization header as "Bearer " followed by the token.', 'A JWT filter strips the prefix, verifies the token, and marks the request authenticated.'],
  overview: 'After login, the React app stores the token and sends `Authorization: Bearer eyJ...` on every request. The server\'s first job is to pull the token out safely: right prefix, non-empty.',
  goals: ['Parse a Bearer header.', 'Reject missing or malformed headers.'],
  diagram: ['Authorization: Bearer abc.def.ghi', [['startsWith("Bearer ")?', 'Else: no token'], ['substring(7)', 'abc.def.ghi'], ['Verify', 'Then authenticate']]],
  sections: [
    ['Parsing', ['"Bearer " is 7 characters, so substring(7) is the token.', 'Prefix check is case-sensitive; an empty token is invalid.']],
    ['In Spring', ['A OncePerRequestFilter reads the header, verifies, and sets SecurityContextHolder.', 'Register it with http.addFilterBefore(...).'], 'String header = request.getHeader("Authorization");'],
  ],
  misconception: 'Having an Authorization header isn\'t being authenticated. The token inside must verify.',
  takeaway: 'Prefix, extract, verify.',
  tryIt: 'Call token("Bearer ") and predict it.',
  example: program('System.out.println(token("Bearer xyz"));\nSystem.out.println(token(null));', { statics: 'static String token(String header) {\n    if (header == null || !header.startsWith("Bearer ")) return "none";\n    return header.substring(7);\n}' }),
  predict: src('security').prediction,
  guided: src('security').guided,
  practice: {
    title: 'Extract the token', signature: 'static Optional<String> bearerToken(String header)',
    prompt: 'Implement bearerToken to return the token after "Bearer ", or empty for null, a wrong prefix, or a blank token.',
    description: 'The first step of a JWT filter.', requirements: ['"Bearer abc": Optional[abc].', 'null, "bearer abc", "Bearer ", "Bearer   ": empty.'],
    examples: [['bearerToken("Bearer abc")', 'Optional[abc]'], ['bearerToken("Bearer ")', 'Optional.empty']], constraints: ['Never return null.'],
    starter: program('System.out.println(bearerToken("Bearer abc"));', { statics: 'static Optional<String> bearerToken(String header) {\n    return Optional.empty();\n}' }),
    reference: program('System.out.println(bearerToken("Bearer abc"));', { statics: 'static Optional<String> bearerToken(String header) {\n    if (header == null || !header.startsWith("Bearer ")) return Optional.empty();\n    String t = header.substring(7);\n    return t.isBlank() ? Optional.empty() : Optional.of(t);\n}' }),
    tests: checks('eq("ok", Optional.of("abc"), Main.bearerToken("Bearer abc"));\neq("null", Optional.empty(), Main.bearerToken(null));\neq("lower", Optional.empty(), Main.bearerToken("bearer abc"));\neq("empty", Optional.empty(), Main.bearerToken("Bearer "));\neq("blank", Optional.empty(), Main.bearerToken("Bearer   "));'),
    hints: ['Check null and prefix first.', 'Then check the rest isn\'t blank.', 'return t.isBlank() ? Optional.empty() : Optional.of(t);'],
  },
  sources: [{ title: 'Spring Security: Servlet architecture', url: S + 'spring-security/reference/servlet/architecture.html' }],
}),

lesson({
  id: 'auth-status', title: '401 means "who are you?"; 403 means "not allowed"', file: 'config/SecurityConfig.java',
  explanation: ['401 Unauthorized: no valid login. 403 Forbidden: logged in, but lacking permission.', 'Check identity first, then permission.'],
  overview: 'An anonymous visitor to /api/admin/reports gets 401: log in first. A logged-in RIDER gets 403: you\'re known, but not allowed. The order of checks decides which one you send.',
  goals: ['Choose between 401 and 403.', 'Order the checks correctly.'],
  diagram: ['GET /api/admin/reports', [['No user?', '401'], ['Not ADMIN?', '403'], ['Else', '200']]],
  sections: [
    ['Two questions', ['Authentication: who are you? Failure is 401.', 'Authorization: may you do this? Failure is 403.']],
    ['Order', ['Always check identity before permission.', 'In Spring: .requestMatchers("/api/admin/**").hasRole("ADMIN").'], 'if (role.isEmpty()) return 401;\nif (!role.get().equals("ADMIN")) return 403;'],
  ],
  misconception: 'Answering 403 to an anonymous user hides the real fix (log in). Anonymous is 401.',
  takeaway: 'Identity first (401), permission second (403).',
  tryIt: 'Call status(true, false) in the example.',
  example: program('System.out.println(status(false, false));\nSystem.out.println(status(true, false));\nSystem.out.println(status(true, true));', { statics: 'static int status(boolean loggedIn, boolean allowed) {\n    if (!loggedIn) return 401;\n    if (!allowed) return 403;\n    return 200;\n}' }),
  predict: { code: program('System.out.println(adminOnly(null));\nSystem.out.println(adminOnly("ADMIN"));\nSystem.out.println(adminOnly("RIDER"));', { statics: 'static int adminOnly(String role) {\n    if (role == null) return 401;\n    return role.equals("ADMIN") ? 200 : 403;\n}' }), expected: '401\n200\n403\n', explanation: 'null role means nobody is logged in. ADMIN passes. RIDER is known but not allowed.' },
  guided: {
    title: 'Anonymous gets 401', signature: 'static int check(Optional<String> role, boolean needsAdmin)',
    prompt: 'Change check so anonymous requests get 401 even on admin routes; the starter checks permission first and wrongly answers 403.',
    description: 'Wrong order of checks.', requirements: ['Empty role: 401.', 'needsAdmin and role isn\'t ADMIN: 403.', 'Else 200.'],
    examples: [['check(empty, true)', '401'], ['check(RIDER, true)', '403']], constraints: ['Reorder, don\'t add rules.'],
    starter: program('System.out.println(check(Optional.empty(), true));', { statics: 'static int check(Optional<String> role, boolean needsAdmin) {\n    if (needsAdmin && !role.orElse("").equals("ADMIN")) return 403;\n    if (role.isEmpty()) return 401;\n    return 200;\n}' }),
    reference: program('System.out.println(check(Optional.empty(), true));', { statics: 'static int check(Optional<String> role, boolean needsAdmin) {\n    if (role.isEmpty()) return 401;\n    if (needsAdmin && !role.get().equals("ADMIN")) return 403;\n    return 200;\n}' }),
    tests: checks('eq("anon admin", 401, Main.check(Optional.empty(), true));\neq("anon", 401, Main.check(Optional.empty(), false));\neq("rider admin", 403, Main.check(Optional.of("RIDER"), true));\neq("admin", 200, Main.check(Optional.of("ADMIN"), true));\neq("rider", 200, Main.check(Optional.of("RIDER"), false));'),
    hints: ['Which question comes first?', 'Move the isEmpty check up.', 'if (role.isEmpty()) return 401;'],
  },
  practice: src('security').practice,
  sources: [{ title: 'Spring Security: Authorize HTTP requests', url: S + 'spring-security/reference/servlet/authorization/authorize-http-requests.html' }],
}),

conceptLesson({
  id: 'filter-chain', title: 'Every request walks the security filter chain', file: 'config/SecurityConfig.java',
  explanation: ['Before any controller runs, Spring Security passes the request through an ordered list of filters.', 'Any filter can stop the request (401/403) or pass it on.'],
  overview: 'SecurityConfig builds a SecurityFilterChain. Today it has no JWT filter, so "authenticated" routes can never succeed (known issue #1). Adding one means placing it before Spring\'s authorization step.',
  goals: ['Describe the order: authenticate, then authorize, then controller.', 'Know where a JWT filter goes.'],
  diagram: ['GET /api/rides', [['JwtAuthFilter', 'Reads and verifies the token'], ['AuthorizationFilter', 'permitAll or authenticated?'], ['Controller', 'Only if both passed']]],
  sections: [
    ['Configuring', ['http.authorizeHttpRequests(...) sets rules; first match wins, anyRequest() last.', 'http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class) inserts yours.']],
    ['Stateless', ['sessionCreationPolicy(STATELESS): no server sessions; every request carries its token.', 'That\'s why csrf().disable() is reasonable for this API.']],
  ],
  misconception: 'permitAll doesn\'t skip the filters. They still run; the authorization step just won\'t reject anonymous users.',
  takeaway: 'Filters run in order, before controllers.',
  tryIt: 'Read SecurityConfig.java and list its rules in order.',
  example: 'Read the chain on the left, then config/SecurityConfig.java in comet-carpool. This is a conceptual checkpoint; no code runs.',
  predict: { prompt: 'SecurityConfig requires authentication for /api/rides, but no filter reads tokens. A request with a valid Bearer token arrives. Result? A: 200, since the token is valid; B: rejected, because nothing ever authenticated the request; C: Spring reads JWTs automatically.', answer: 'B', explanation: 'Without a filter that verifies the token and sets the security context, the request stays anonymous.' },
  guided: { title: 'Insert the JWT filter', prompt: 'Which change makes tokens count? A: add a OncePerRequestFilter that verifies the token, and register it with http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class); B: permitAll on every route; C: enable CSRF.', answer: 'A', hints: ['Something must read the token on each request.', 'It must run before authorization.', 'Answer with the addFilterBefore letter.'] },
  practice: { title: 'Rule order', prompt: 'Rules: (1) anyRequest().authenticated() then (2) requestMatchers("/api/test").permitAll(). What happens to GET /api/test anonymously? A: allowed; B: Spring rejects this configuration, because anyRequest() must come last; C: random.', answer: 'B', hints: ['Rules are checked in order.', 'anyRequest matches everything.', 'Answer with the "must be last" letter.'] },
  sources: [{ title: 'Spring Security: Servlet architecture', url: S + 'spring-security/reference/servlet/architecture.html' }],
}),

trimmed('testing', 'A good test fails when the code is wrong', [1, 3]),

];
