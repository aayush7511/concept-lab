// "Java & Spring Boot for CometCarpool": tickets are real files and roadmap items in
// ~/Desktop/comet-carpool (src/backend and docs/wiki/known-issues.md).
import { core } from './lessons-core.mjs';
import { spring } from './lessons-spring.mjs';

export const javaVersion = 1;
const all = [...core, ...spring];
export const javaLessons = Object.fromEntries(all.map(l => [l.id, l]));

const J = 'https://dev.java/learn/', S = 'https://docs.spring.io/';
// [id, prerequisites, source, why]
const plan = [
  ['program', [], J + 'getting-started/', 'Read BackendApplication.main and run any Java file.'],
  ['types', ['program'], J + 'language-basics/primitive-types/', 'Read User fields such as Long id and String email.'],
  ['methods', ['types'], J + 'classes-objects/defining-methods/', 'Read UserService methods such as saveUser and loginUser.'],
  ['conditions', ['methods'], J + 'strings/', 'Follow the UTD-email and duplicate checks in saveUser.'],
  ['classes', ['methods'], J + 'classes-objects/', 'Understand User, LoginResponse, and new Ride objects.'],
  ['encapsulation', ['classes'], J + 'classes-objects/more-on-classes/', 'Read the private fields and getters/setters JPA and Jackson rely on.'],
  ['exceptions', ['conditions'], J + 'exceptions/', 'Follow IllegalArgumentException from UserService to the 400 response.'],
  ['collections', ['classes'], J + 'api/collections-framework/', 'Read List<User> and JpaRepository<User, Long>.'],
  ['interfaces', ['classes', 'collections'], J + 'interfaces/', 'Understand UserRepository and PasswordEncoder as swappable contracts.'],
  ['optional', ['interfaces', 'exceptions'], J + 'api/streams/optionals/', 'Handle missing users safely in login and lookups.'],
  ['records-enums', ['encapsulation', 'exceptions'], J + 'records/', 'Replace LoginRequest boilerplate and lock roles to an enum.'],
  ['lambdas', ['interfaces', 'records-enums'], J + 'lambdas/', 'Read csrf -> csrf.disable() and filter rides with streams.'],
  ['builders', ['lambdas'], J + 'strings/string-builders/', 'Read Jwts.builder() and http.csrf(...).authorizeHttpRequests(...) chains.'],
  ['time', ['methods', 'optional'], J + 'date-time/', 'Compute token expiry and ride departure cutoffs.'],
  ['annotations', ['interfaces', 'collections'], J + 'annotations/', 'Know what @Service, @Entity, and @GetMapping actually do.'],
  ['injection', ['annotations', 'interfaces'], S + 'spring-framework/reference/core/beans/dependencies/factory-collaborators.html', 'Understand why UserController takes UserService in its constructor.'],
  ['maven-boot', ['injection'], S + 'spring-boot/reference/using/structuring-your-code.html', 'Build and start the backend; read pom.xml and application.properties.'],
  ['rest', ['records-enums', 'injection'], S + 'spring-framework/reference/web/webmvc/mvc-controller.html', 'Read and add endpoints in UserController.'],
  ['errors', ['rest', 'exceptions', 'lambdas'], S + 'spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html', 'Extend GlobalExceptionHandler with consistent JSON errors.'],
  ['jpa', ['annotations', 'encapsulation'], S + 'spring-data/jpa/reference/jpa/entity-persistence.html', 'Map User and Ride to Postgres tables safely.'],
  ['repositories', ['jpa', 'optional', 'lambdas'], S + 'spring-data/jpa/reference/jpa/query-methods.html', 'Write UserRepository and RideRepository query methods.'],
  ['validation', ['rest', 'records-enums', 'time'], S + 'spring-framework/reference/core/validation/beanvalidation.html', 'Reject bad registration and ride input with 400s (known issue #7).'],
  ['hashing', ['interfaces', 'lambdas'], S + 'spring-security/reference/features/authentication/password-storage.html', 'Understand BCryptPasswordEncoder.encode and matches.'],
  ['jwt', ['hashing', 'builders', 'time'], 'https://www.rfc-editor.org/rfc/rfc7519', 'Generate and verify the login token (known issue #1).'],
  ['security', ['jwt', 'lambdas'], S + 'spring-security/reference/servlet/architecture.html', 'Add the JWT filter and protect endpoints in SecurityConfig.'],
  ['testing', ['interfaces', 'exceptions', 'injection'], 'https://docs.junit.org/current/user-guide/', 'Write UserService tests with JUnit and Mockito (roadmap #6).'],
];

const tickets = [
  { id: 'T1', title: 'Read the User model and DTOs', file: 'src/backend/src/main/java/com/cometcarpool/backend/model/User.java', conceptIds: ['program', 'types', 'methods', 'classes', 'encapsulation'] },
  { id: 'T2', title: 'Understand registration and login rules in UserService', file: 'src/backend/src/main/java/com/cometcarpool/backend/service/UserService.java', conceptIds: ['conditions', 'exceptions', 'collections', 'interfaces', 'optional'] },
  { id: 'T3', title: 'How Spring wires and starts the backend', file: 'src/backend/pom.xml', conceptIds: ['annotations', 'injection', 'maven-boot'] },
  { id: 'T4', title: 'Users table and UserRepository', file: 'src/backend/src/main/java/com/cometcarpool/backend/repository/UserRepository.java', conceptIds: ['jpa', 'repositories'] },
  { id: 'T5', title: 'REST endpoints, DTOs, and error handling', file: 'src/backend/src/main/java/com/cometcarpool/backend/controller/UserController.java', conceptIds: ['records-enums', 'rest', 'errors', 'validation'] },
  { id: 'T6', title: 'Passwords, JWTs, and the security filter chain', file: 'src/backend/src/main/java/com/cometcarpool/backend/config/SecurityConfig.java', conceptIds: ['lambdas', 'builders', 'time', 'hashing', 'jwt', 'security'] },
  { id: 'T7', title: 'Build ride offers (UC-02): Ride entity, repository, service, controller', file: 'src/backend/src/main/java/com/cometcarpool/backend/model/Ride.java', conceptIds: ['records-enums', 'lambdas', 'time', 'jpa', 'repositories', 'rest', 'validation'] },
  { id: 'T8', title: 'Test UserService with JUnit and Mockito', file: 'src/backend/src/test/java/com/cometcarpool/backend/service/UserServiceTest.java', conceptIds: ['interfaces', 'injection', 'testing'] },
];

const spec = `# CometCarpool backend: learning tickets

Source: ~/Desktop/comet-carpool (Spring Boot 4.1, Java 21, PostgreSQL, Spring Security + JWT). Exercises run as plain JDK 21 code; Spring itself isn't downloaded, so each lesson models what the framework does and links to the real file.

## T1: Read the User model and DTOs
Open model/User.java, dto/LoginRequest.java, and dto/LoginResponse.java. Explain every field, constructor, getter, and setter, and why User needs an empty constructor. Done when you can explain each line and why @JsonIgnore sits on password.

## T2: Understand registration and login rules in UserService
Walk through saveUser and loginUser. Explain each check, why a null email is tested first, which exception is thrown and where it ends up, and why login uses one message for both failure cases. Stretch: fix known issue #9 (email case sensitivity).

## T3: How Spring wires and starts the backend
Explain pom.xml starters, @SpringBootApplication, component scanning, and how UserController gets its UserService and JwtService. Run \`./mvnw spring-boot:run\` with DB credentials from environment variables (known issue #12).

## T4: Users table and UserRepository
Explain how @Entity, @Table, @Id, and @GeneratedValue become the users table, what SQL existsByEmail and findByEmail produce, and add a unique constraint on email (known issue #8).

## T5: REST endpoints, DTOs, and error handling
Replace the User request/response with records (known issue #4), add @Valid validation (known issue #7), and make GlobalExceptionHandler return consistent JSON errors (known issue #10).

## T6: Passwords, JWTs, and the security filter chain
Explain BCrypt encode/matches, read JwtService's builder chain, move the secret to config (known issue #2), and add a JWT filter so protected routes actually work (known issue #1). Lock down GET /api/users (known issue #3).

## T7: Build ride offers (UC-02): Ride entity, repository, service, controller
Add Ride (driver as @ManyToOne User, origin, destination, departure time, seats, status enum), RideRepository with query methods, RideService rules (seats 1–7, future departure), and POST/GET /api/rides. Settle P2 questions Q7 and Q8 first.

## T8: Test UserService with JUnit and Mockito
Write UserServiceTest: non-UTD email rejected, duplicate email rejected without saving, password hashed before save, and login failure cases. Use Mockito mocks for UserRepository and PasswordEncoder.
`;

export const javaCourse = {
  id: 'comet-java', title: 'Java & Spring Boot for CometCarpool', language: 'java', courseVersion: javaVersion,
  description: 'Learn Java and Spring Boot from zero by working through the real CometCarpool backend: models, services, repositories, controllers, security, and tests.',
  learnerProfile: 'New to Java and Spring Boot. Knows some Python, JavaScript, and Go. Wants to fully understand and extend the CometCarpool backend.',
  concepts: plan.map(([id, prerequisites, url, why]) => ({ id, title: javaLessons[id]?.title || id, prerequisites, sourceUrls: [url], why })),
  tickets, spec,
};

// Same contract as the LLM course: replace lessons only on a version bump, and archive any
// saved attempt whose exercise prompt changed so old answers never grade against new tasks.
export function seedJava(data) {
  const old = data.projects.find(p => p.id === javaCourse.id);
  if (!old) data.projects.push(structuredClone(javaCourse));
  else if (old.courseVersion !== javaVersion) Object.assign(old, structuredClone(javaCourse));
  for (const [id, l] of Object.entries(javaLessons)) {
    const key = `${javaCourse.id}:${id}`, previous = data.lessons[key];
    if (previous && previous.courseVersion === javaVersion) continue;
    const progress = data.progress[key];
    for (const stage of ['guided', 'practice']) if (previous && progress && previous[stage]?.prompt !== l[stage].prompt) {
      progress[stage + 'History'] = [...(progress[stage + 'History'] || []), { prompt: previous[stage]?.prompt, draft: progress.drafts?.[stage], passed: progress.passes?.[stage], at: new Date().toISOString() }];
      progress.drafts = { ...progress.drafts, [stage]: l.mode === 'conceptual' ? '' : l[stage].starter };
      progress.passes = { ...progress.passes, [stage]: false };
      progress.hints = { ...progress.hints, [stage]: 0 };
      progress.revealed = { ...progress.revealed, [stage]: false };
    }
    data.lessons[key] = { ...structuredClone(l), courseVersion: javaVersion };
  }
}
