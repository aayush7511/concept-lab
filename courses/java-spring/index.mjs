// "Java & Spring Boot for CometCarpool": tickets are real files and roadmap items in
// ~/Desktop/comet-carpool (src/backend and docs/wiki/known-issues.md).
import { basics } from './lessons-basics.mjs';
import { modern } from './lessons-modern.mjs';
import { spring } from './lessons-spring.mjs';

export const javaVersion = 2;
const all = [...basics, ...modern, ...spring];
export const javaLessons = Object.fromEntries(all.map(l => [l.id, l]));

// One nanoconcept per lesson (concept-lab/CLAUDE.md). [id, prerequisites, why]
const plan = [
  ['main', [], 'Read BackendApplication.main.'],
  ['variables', ['main'], 'Read fields and local values.'],
  ['concat', ['variables'], 'Read messages built with +.'],
  ['int-division', ['variables'], 'Avoid losing fractions in cost splits.'],
  ['wrappers', ['variables'], 'Understand why User.id is a Long.'],
  ['methods', ['concat'], 'Read UserService methods.'],
  ['classes', ['methods'], 'Understand how User objects are built.'],
  ['instance-methods', ['classes'], 'Read methods that change an object.'],
  ['references', ['instance-methods'], 'Know when two names share one object.'],
  ['getters-setters', ['classes'], 'Read User\'s private fields and accessors.'],
  ['this', ['getters-setters'], 'Read every setter and constructor in User.'],
  ['if-else', ['methods'], 'Follow UserService\'s branches.'],
  ['and-or', ['if-else'], 'Read the null-first email check.'],
  ['string-equals', ['and-or'], 'Compare roles and emails correctly.'],
  ['string-cleanup', ['string-equals'], 'Normalize emails (known issue #9).'],
  ['try-catch', ['if-else'], 'See how errors are handled.'],
  ['throw', ['try-catch'], 'Follow saveUser\'s IllegalArgumentException.'],
  ['lists', ['methods'], 'Read List<User> from getAllUsers.'],
  ['loops', ['lists'], 'Count and total collections.'],
  ['maps', ['loops'], 'Look values up by key.'],
  ['interfaces', ['classes'], 'Understand UserRepository and PasswordEncoder.'],
  ['null-checks', ['if-else'], 'Handle findByEmail returning null.'],
  ['optional', ['null-checks', 'maps'], 'Use findById\'s Optional.'],
  ['records', ['classes'], 'Write DTOs like LoginRequest in one line.'],
  ['enums', ['string-cleanup', 'throw'], 'Lock roles to fixed values (issue #4).'],
  ['lambdas', ['interfaces'], 'Read csrf -> csrf.disable().'],
  ['streams', ['lambdas', 'records', 'maps'], 'Search rides (UC-03).'],
  ['builders', ['instance-methods'], 'Read Jwts.builder() and http chains.'],
  ['immutable-strings', ['string-cleanup'], 'Keep the result of String methods.'],
  ['instants', ['methods'], 'Compute token expiry.'],
  ['local-times', ['instants'], 'Schedule departures and cutoffs.'],
  ['annotations', ['interfaces', 'lists'], 'Know what @Service and @GetMapping do.'],
  ['injection', ['annotations'], 'See how UserController gets UserService.'],
  ['maven', ['injection'], 'Read pom.xml.'],
  ['component-scan', ['maven'], 'Know where new classes must live.'],
  ['properties', ['component-scan'], 'Configure the DB without committing secrets.'],
  ['http-status', ['injection', 'records'], 'Choose response codes.'],
  ['json', ['http-status'], 'Know the exact JSON the frontend receives.'],
  ['controllers', ['json'], 'Read and add endpoints.'],
  ['errors', ['controllers', 'throw', 'lambdas'], 'Extend GlobalExceptionHandler (issue #10).'],
  ['entities', ['annotations', 'getters-setters'], 'Map User to the users table.'],
  ['constraints', ['entities'], 'Stop duplicate emails (issue #8).'],
  ['relationships', ['entities'], 'Link rides to drivers (T7).'],
  ['repository-save', ['entities', 'optional'], 'Understand save.'],
  ['derived-queries', ['repository-save', 'string-equals'], 'Write existsByEmail and ride search queries.'],
  ['validation', ['controllers', 'records', 'local-times'], 'Return 400s for bad input (issue #7).'],
  ['hashing', ['interfaces'], 'Understand password storage.'],
  ['salts', ['hashing', 'lambdas'], 'Understand BCrypt encode/matches.'],
  ['jwt-structure', ['salts', 'builders'], 'Read generateToken.'],
  ['jwt-verify', ['jwt-structure', 'instants'], 'Verify tokens (issue #1).'],
  ['bearer', ['jwt-verify'], 'Read the Authorization header.'],
  ['auth-status', ['bearer', 'optional'], 'Choose 401 vs 403.'],
  ['filter-chain', ['auth-status'], 'Add the JWT filter to SecurityConfig.'],
  ['testing', ['interfaces', 'injection', 'throw'], 'Write UserService tests (roadmap #6).'],
];

const tickets = [
  { id: 'T1', title: 'Read the User model and DTOs', file: 'src/backend/src/main/java/com/cometcarpool/backend/model/User.java', conceptIds: ['main', 'variables', 'concat', 'int-division', 'wrappers', 'methods', 'classes', 'instance-methods', 'references', 'getters-setters', 'this'] },
  { id: 'T2', title: 'Understand registration and login rules in UserService', file: 'src/backend/src/main/java/com/cometcarpool/backend/service/UserService.java', conceptIds: ['if-else', 'and-or', 'string-equals', 'string-cleanup', 'try-catch', 'throw', 'lists', 'loops', 'maps', 'interfaces', 'null-checks', 'optional'] },
  { id: 'T3', title: 'How Spring wires and starts the backend', file: 'src/backend/pom.xml', conceptIds: ['annotations', 'injection', 'maven', 'component-scan', 'properties'] },
  { id: 'T4', title: 'Users table and UserRepository', file: 'src/backend/src/main/java/com/cometcarpool/backend/repository/UserRepository.java', conceptIds: ['entities', 'constraints', 'repository-save', 'derived-queries'] },
  { id: 'T5', title: 'REST endpoints, DTOs, and error handling', file: 'src/backend/src/main/java/com/cometcarpool/backend/controller/UserController.java', conceptIds: ['records', 'enums', 'http-status', 'json', 'controllers', 'errors', 'validation'] },
  { id: 'T6', title: 'Passwords, JWTs, and the security filter chain', file: 'src/backend/src/main/java/com/cometcarpool/backend/config/SecurityConfig.java', conceptIds: ['lambdas', 'builders', 'immutable-strings', 'instants', 'hashing', 'salts', 'jwt-structure', 'jwt-verify', 'bearer', 'auth-status', 'filter-chain'] },
  { id: 'T7', title: 'Build ride offers (UC-02): Ride entity, repository, service, controller', file: 'src/backend/src/main/java/com/cometcarpool/backend/model/Ride.java', conceptIds: ['records', 'enums', 'streams', 'local-times', 'relationships', 'derived-queries', 'controllers', 'validation'] },
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
  concepts: plan.map(([id, prerequisites, why]) => ({ id, title: javaLessons[id].title, prerequisites, sourceUrls: [javaLessons[id].sources[0].url], why })),
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
