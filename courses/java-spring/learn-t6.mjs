// Rewritten Learn content for T6 (lambdas → filter-chain).
export const rewritesT6 = {

lambdas: {
  overview: "A lambda is a small function written inline, without a name: `n -> n * 2` means “given n, return n times 2”. You can store it in a variable or hand it to another method, which runs it later. In `http.csrf(csrf -> csrf.disable())` you give Spring a lambda and Spring calls it when it is ready.",
  goals: [
    "Read a lambda: the parameters on the left of `->`, the result on the right.",
    "Name the interface a lambda fits, such as Predicate or Function.",
    "Call a stored lambda with `test`, `apply`, or `run`.",
  ],
  diagram: ["Building and calling a lambda", [
    ["s -> s > 0", "A lambda. The parameter is s, and the result is true or false."],
    ["Predicate<Integer> open = ...", "The lambda is stored in a variable whose type says what kind of function it is."],
    ["open.test(3)", "Calling the interface's one method runs the lambda with s = 3."],
    ["3 > 0", "The right side is evaluated using the argument."],
    ["true", "That value is returned to the caller."],
  ]],
  sections: [
    ["A function you can pass around", [
      "Until now, code only ran when you called a named method. A lambda is code with no name that you can put in a variable or pass as an argument. The code runs later, when someone calls it.",
      "The arrow `->` splits the lambda. On the left are the parameters, the inputs. On the right is the body, the work to do. `s -> s > 0` takes s and returns whether it is positive.",
      "With more than one parameter you use parentheses, as in `(a, b) -> a + b`. With none you write `() -> ...`. A body in braces `{ ... }` may hold several statements and needs a `return`.",
    ], "s -> s > 0              // one parameter\n(a, b) -> a + b         // two parameters\n() -> System.out.println(\"ran\")"],
    ["Which interface does it fit?", [
      "A lambda always becomes an object of an interface that has exactly one abstract method, called a functional interface. That is why interfaces came first in this course.",
      "`Predicate<Integer>` has one method, `test`, which takes an Integer and returns a boolean. `Function<Integer, Integer>` has `apply`, which takes one Integer and returns another. `Runnable` has `run` with no input or output.",
      "The types in the angle brackets are the input and result types. So `Function<Integer, Integer> twice = n -> n * 2;` is a function from an Integer to an Integer.",
    ], "Predicate<Integer> open = s -> s > 0;\nSystem.out.println(open.test(3));   // true"],
  ],
  walkthrough: ["Tracing the example", [
    ["Predicate<Integer> open = s -> s > 0;", "A lambda object is created and stored in `open`. Its body has not run yet, because nobody has called it."],
    ["Function<Integer, Integer> twice = n -> n * 2;", "A second lambda is stored in `twice`. It also waits to be called."],
    ["open.test(3)", "`test` runs the lambda with s = 3. The body `3 > 0` is true, so true is returned."],
    ["open.test(0)", "This time s = 0. The body `0 > 0` is false, so false is returned. The program prints: true false"],
    ["twice.apply(4)", "`apply` runs the second lambda with n = 4. The body `4 * 2` is 8, and the program prints: 8"],
  ]],
  deeper: [
    ["Method references", [
      "When a lambda only calls one existing method, you can shorten it. `String::toUpperCase` means the same as `s -> s.toUpperCase()`. The `::` points at a method without calling it. The predict step uses this.",
    ]],
    ["Lambdas capture variables", [
      "A lambda body can read local variables from the surrounding method, but only if they never change after being set, which Java calls effectively final. Trying to change such a variable inside a lambda is a compile error.",
    ]],
    ["Where you meet lambdas in Spring", [
      "Spring Security's configuration passes lambdas such as `csrf -> csrf.disable()` to describe each setting. Streams use them too: see \"A stream filters and maps a collection\". Spring stores your lambda and calls it at the right moment.",
    ]],
    ["Common bug: a lambda for the wrong interface", [
      "A lambda has no type of its own, so Java works out which interface it must fit from where it is used. If the shape does not match, such as two parameters where one is expected, the compiler reports an error about incompatible types in the lambda.",
    ]],
  ],
  misconception: "A lambda does not run where you write it. Writing `s -> s > 0` only creates the function, and its body runs each time something calls its method, such as `test`.",
  takeaway: "A lambda is a nameless function: parameters, an arrow, and a body. It fits an interface with a single method and runs when that method is called.",
},

builders: {
  overview: "A builder is an object you configure one step at a time. Each setting method returns the builder itself, so calls can be chained in a row, and a final method such as `build()` produces the result. `Jwts.builder()` in JwtService uses exactly this to make a token.",
  goals: [
    "Explain why a builder method ends with `return this`.",
    "Read a chain like `.subject(...).ttl(60).build()` one call at a time.",
    "Say what the last call in a chain does.",
  ],
  diagram: ["Building a token with a chain", [
    ["new TokenBuilder()", "Starts with defaults: subject is empty and ttl is 0."],
    ["subject(\"ana@utdallas.edu\")", "Stores the subject, then returns the same builder."],
    ["ttl(60)", "Called on that returned builder. Stores 60 minutes, then returns it again."],
    ["build()", "The last call. It reads the settings and returns a String."],
    ["\"ana@utdallas.edu|60\"", "The finished result."],
  ]],
  sections: [
    ["Methods that return this", [
      "`this` means the object a method is running on. A method ending in `return this;` hands that same object back to the caller.",
      "That makes a chain possible. `a.subject(\"x\")` gives back `a`, so you can put `.ttl(60)` straight after it, then another call, all on one line.",
      "Each method is still an ordinary instance method that changes a field, as in the earlier lessons. Only the `return this` is new.",
    ], "TokenBuilder subject(String s) {\n    this.subject = s;   // store the setting\n    return this;        // hand back the same builder\n}"],
    ["The last step makes the result", [
      "The settings methods return the builder, so their result is not the thing you want. A final method such as `build()` (in JJWT, `compact()`) turns the stored settings into the finished object.",
      "In JwtService the chain reads like a sentence: set the subject, set the issue time, set the expiry, sign with the key, then `compact()` to get the token text.",
      "Builders keep long recipes readable. Without one you would need a constructor with many parameters in a fixed order.",
    ], "String token = new TokenBuilder()\n    .subject(\"ana@utdallas.edu\")\n    .ttl(60)\n    .build();"],
  ],
  walkthrough: ["Tracing the example", [
    ["new TokenBuilder()", "A builder object is created. Its fields hold the defaults: subject is \"\" and ttl is 0."],
    [".subject(\"ana@utdallas.edu\")", "The method sets the subject field and returns `this`. The value of this expression is the same builder, now with a subject."],
    [".ttl(60)", "Called on that same builder. The ttl field becomes 60, and `this` is returned again."],
    [".build()", "The final method. It joins the fields with `|` and returns a String: subject + \"|\" + ttl."],
    ["System.out.println(...)", "The String is \"ana@utdallas.edu|60\", so the program prints: ana@utdallas.edu|60"],
  ]],
  deeper: [
    ["The builder and the result are different objects", [
      "The builder holds settings while you work. `build()` gives you a separate finished object, such as the token String. The builder is thrown away. Mixing them up, for example trying to use the builder as the token, gives a type error.",
    ]],
    ["Common bug: forgetting the final call", [
      "If you write `String t = new TokenBuilder().subject(\"x\");` the compiler complains, because the expression has type TokenBuilder, not String. You must end the chain with `build()` (or `compact()` for JJWT) to get the result.",
    ]],
    ["Chains are just nested calls", [
      "A chain like `a.b().c()` is the same as `X x = a.b(); x.c();`. Each dot calls a method on whatever the previous call returned. Putting one call per line is only formatting. This is also how Spring's `http.csrf(...).authorizeHttpRequests(...)` chain reads.",
    ]],
    ["Mutable or immutable builders", [
      "This builder changes its own fields and returns itself. Some libraries instead return a brand-new builder with each call and leave the old one unchanged. When using a library, check whether the return value must be kept. See \"String methods return a new String\".",
    ]],
  ],
  misconception: "Chaining does not make the calls happen at once. They run one after another, left to right, and each call works on whatever the call before it returned.",
  takeaway: "A builder method stores a setting and returns this, so calls chain. A last method such as build or compact produces the result.",
},

"immutable-strings": {
  overview: "A String can never be changed after it is created, which Java calls immutable. Methods such as `toUpperCase()` and `trim()` do not modify the text: they return a new String. If you do not save the returned value, the work is thrown away and the original stays as it was.",
  goals: [
    "Explain what immutable means for a String.",
    "Keep the result of a String method by assigning it.",
    "Spot a line like `email.toLowerCase();` that does nothing.",
  ],
  diagram: ["What s.toUpperCase() really does", [
    ["String s = \"ride\"", "The variable s refers to the text \"ride\"."],
    ["s.toUpperCase()", "Java builds a brand-new String \"RIDE\". The old \"ride\" is untouched."],
    ["Result not stored", "On its own line, the new String is dropped and nobody can reach it."],
    ["s = s.toUpperCase()", "This stores the new String back into s."],
    ["s now refers to \"RIDE\"", "The variable points at the new text."],
  ]],
  sections: [
    ["Strings do not change", [
      "Immutable means that once a value exists, it can never be altered. A String's characters are fixed for its whole life.",
      "So methods like `toUpperCase`, `trim`, `toLowerCase`, and `replace` cannot edit the String they are called on. Instead each one builds and returns a second String with the change applied.",
      "The variable still points at the old text unless you tell it otherwise. That is a very common beginner surprise, because the line looks like it should work.",
    ], "String s = \"ride\";\ns.toUpperCase();          // result thrown away\nSystem.out.println(s);    // ride"],
    ["Keep the returned value", [
      "To keep the change, assign the returned String to a variable: `s = s.toUpperCase();`. Now `s` points at the new text.",
      "This matters for cleaning emails. `email = email.trim().toLowerCase();` works because each call returns a String that the next call uses, and the final result is stored.",
      "The compiler does not warn about the wasted line. Both versions compile, so you must check that every String method call has its result used.",
    ], "s = s.toUpperCase();    // keep the new String\nSystem.out.println(s);    // RIDE"],
  ],
  walkthrough: ["Tracing the example", [
    ["String s = \"ride\";", "The variable s refers to a String holding the text ride."],
    ["s.toUpperCase();", "Java creates a new String RIDE. The statement ends there, so nothing stores it, and it is discarded. s still refers to ride."],
    ["System.out.println(s);", "Prints the unchanged text: ride"],
    ["s = s.toUpperCase();", "Again a new String RIDE is built, but this time the assignment makes s refer to it."],
    ["System.out.println(s);", "s now refers to RIDE, so the program prints: RIDE"],
  ]],
  deeper: [
    ["Why Java makes Strings immutable", [
      "Immutable Strings can be shared safely, because nobody can change text out from under another part of the program. Java can reuse identical string literals, and strings can be used as map keys without surprises. The price is that every change makes a new object.",
    ]],
    ["Common bug: unnormalized emails", [
      "Known issue #9 is email case sensitivity. If a service calls `email.toLowerCase();` without assigning, the email stays mixed-case and the duplicate check misses it. Always write `email = email.toLowerCase();`.",
    ]],
    ["Other classes work the same way", [
      "Immutable types are common: the wrapper types such as Long, records, and the java.time classes in \"Instant + Duration computes deadlines\" all return new values instead of changing. The `List` is different: `add` changes the list itself.",
    ]],
    ["Building text in a loop", [
      "Joining Strings with `+` inside a long loop creates many temporary objects. For heavy loops Java offers `StringBuilder`, a mutable text buffer you append to. For a few joins in a service, plain `+` is fine.",
    ]],
  ],
  misconception: "toUpperCase does not change the String it is called on. It returns a different String, and if you do not store it, the result is lost.",
  takeaway: "Strings are immutable. Every String method returns a new String, so assign the result to keep it.",
},

instants: {
  overview: "An Instant is one exact moment on the world's timeline, and a Duration is a length of time such as 24 hours. Adding a Duration to an Instant gives a new Instant, which is how JwtService computes when a token expires. This replaces unreadable arithmetic like `System.currentTimeMillis() + 86400000`.",
  goals: [
    "Say the difference between an Instant and a Duration.",
    "Compute an expiry with `issued.plus(Duration.ofHours(24))`.",
    "Compare moments with `isBefore` and measure gaps with `Duration.between`.",
  ],
  diagram: ["Computing a token's expiry", [
    ["Instant issued", "The moment the token is made: 2026-11-06T15:00:00Z."],
    ["Duration.ofHours(24)", "A length of time, not a moment: 24 hours."],
    ["issued.plus(duration)", "Moves the moment forward by that length."],
    ["Instant expires", "A new Instant: 2026-11-07T15:00:00Z."],
    ["Duration.between(issued, expires)", "Measures the gap between two moments."],
  ]],
  sections: [
    ["A moment versus an amount of time", [
      "An Instant names a single point in time, the same for everyone on Earth. It is written in UTC, and the `Z` at the end of `2026-11-06T15:00:00Z` stands for UTC.",
      "A Duration is only an amount of time, such as 24 hours or 90 minutes. It does not say when. You create one with `Duration.ofHours(24)` or `Duration.ofMinutes(90)`.",
      "You can add a Duration to an Instant to get a later Instant, or ask for the Duration between two Instants. Moment plus amount gives a moment; moment minus moment gives an amount.",
    ], "Instant issued  = Instant.parse(\"2026-11-06T15:00:00Z\");\nInstant expires = issued.plus(Duration.ofHours(24));"],
    ["Readable deadlines", [
      "Older code stores time as a number of milliseconds and writes `86400000` for a day. Nobody can tell what that number means at a glance, and one wrong zero is a bug.",
      "`Duration.ofHours(24)` says what it means. `issued.plus(...)` does not change `issued`, because Instants are immutable like Strings: it returns a new Instant that you must keep.",
      "`isBefore` and `isAfter` compare two Instants. A token is still valid while `now.isBefore(expires)` is true.",
    ], "now.isBefore(expires)            // true while still valid\nDuration.between(issued, expires).toMillis()"],
  ],
  walkthrough: ["Tracing the example", [
    ["Instant.parse(\"2026-11-06T15:00:00Z\")", "Reads the text and makes an Instant for 3 p.m. UTC on 6 November 2026. The variable `issued` refers to it."],
    ["Duration.ofHours(24)", "Creates a Duration of 24 hours. It is only a length of time."],
    ["issued.plus(...)", "Builds a new Instant 24 hours later, 15:00 on 7 November. `issued` is not changed. The variable `expires` refers to the new one."],
    ["System.out.println(expires)", "Printing an Instant shows ISO text, so the program prints: 2026-11-07T15:00:00Z"],
    ["Duration.between(issued, expires).toMillis()", "The gap between the two moments is 24 hours, which is 86,400,000 milliseconds."],
    ["System.out.println(...)", "Prints: 86400000"],
  ]],
  deeper: [
    ["Epoch time and JWTs", [
      "Internally an Instant counts time since 1 January 1970 UTC, called the epoch. JWTs store their expiry as seconds since the epoch, for example `\"exp\":1800000000`. `Instant.ofEpochSecond(...)` and `getEpochSecond()` convert between the two.",
    ]],
    ["Why not just use the clock?", [
      "Code that calls `Instant.now()` inside a method is hard to test, because the answer changes every run. A good habit is to pass `now` in as a parameter, as the practice exercise on cancelling does. See \"A good test fails when the code is wrong\".",
    ]],
    ["Common bug: using Instant for a calendar date", [
      "An Instant has no time zone and no idea what a calendar day is. Adding Duration.ofDays(1) adds exactly 24 hours. For “tomorrow at 8:30 a.m.” on someone's wall clock, use LocalDateTime, covered in \"LocalDateTime is a wall-clock time\".",
    ]],
    ["Instants are immutable", [
      "Like String, Instant never changes. Calling `issued.plus(...)` and ignoring the result does nothing, just as with `s.toUpperCase();`.",
    ]],
  ],
  misconception: "A Duration is not a moment. Duration.ofHours(24) means “a day's worth of time”, and it only becomes a deadline once you add it to an Instant.",
  takeaway: "Instant is a moment, Duration is an amount. Add them to compute deadlines, and compare moments with isBefore and isAfter.",
},

hashing: {
  overview: "A hash function turns any text into a fixed-length fingerprint, and it cannot be run backward. CometCarpool never stores a raw password. It stores a hash, and at login it hashes the attempt and checks that the two fingerprints are equal.",
  goals: [
    "Describe a hash as a one-way fingerprint of some text.",
    "Predict that the same input always gives the same hash and different inputs give different ones.",
    "Explain how login can check a password without storing it.",
  ],
  diagram: ["Storing and checking a password", [
    ["User registers with “secret123”", "The raw password arrives once, in the request."],
    ["Hash it", "SHA-256 turns it into 64 characters of hex text: fcf730b6..."],
    ["Store only the hash", "The raw password is never saved."],
    ["User logs in later", "The attempt is hashed the same way."],
    ["Compare the hashes", "Equal means the password matches. There is no “decrypt” step."],
  ]],
  sections: [
    ["What a hash is", [
      "A hash function is a recipe that reads any amount of text and produces a short result of fixed size, the hash or digest. SHA-256 always gives 32 bytes, which are shown as 64 hex characters.",
      "It is deterministic: the same input always gives exactly the same hash. Change even one character, such as `secret123` to `secret124`, and the hash is completely different.",
      "It is one-way. From the hash you cannot work backward to the text. The only way to find the text is to guess inputs and hash each guess.",
    ], "sha256(\"secret123\")  // fcf730b6d95236ec...\nsha256(\"secret124\")  // 2f43509746809038..."],
    ["Why login still works", [
      "At registration CometCarpool saves the hash of the password. At login it hashes what the user typed and compares the two hashes. If they are equal, the passwords were equal.",
      "That means a leaked database does not reveal passwords directly, only fingerprints. There is no way for the server to “read back” a user's password, and no “forgot password” email can show it.",
      "In the example, `getBytes(UTF_8)` turns the text into bytes, `MessageDigest` computes the SHA-256 of those bytes, and `HexFormat` writes the bytes as hex characters.",
    ], "byte[] digest = MessageDigest.getInstance(\"SHA-256\")\n    .digest(text.getBytes(StandardCharsets.UTF_8));"],
  ],
  walkthrough: ["Tracing the example", [
    ["sha256(\"secret123\")", "The text is turned into bytes, run through SHA-256, and written as hex. The result is 64 characters long and starts with fcf730b6d95236ec."],
    ["h.length() + \" \" + h.substring(0, 16)", "The length is 64 and the first 16 characters are fcf730b6d95236ec, so the program prints: 64 fcf730b6d95236ec"],
    ["h.equals(sha256(\"secret123\"))", "The same input is hashed again and gives the identical 64 characters, so this prints: true"],
    ["sha256(\"secret124\")", "Only the last character differs from the first input."],
    ["....substring(0, 16)", "Yet the hash looks unrelated. The first 16 characters are 2f43509746809038, and that is what the program prints."],
  ]],
  deeper: [
    ["Why plain SHA-256 is not enough for passwords", [
      "SHA-256 is designed to be fast, which helps attackers who try billions of guesses per second. Password storage uses deliberately slow algorithms such as BCrypt. The next lesson explains why a salt is added too.",
    ]],
    ["Hashing is not encryption", [
      "Encryption can be undone with a key. A hash cannot be undone at all. That is why the right word is “check” a password, never “decrypt” it. Another place hashing is used: checking a file has not changed.",
    ]],
    ["Common bug: comparing with the raw password", [
      "If the code compares the typed password with the stored hash directly, login always fails, because the text and its hash are never equal. The attempt must be hashed first. Real code uses `passwordEncoder.matches(raw, stored)`.",
    ]],
    ["Collisions", [
      "Two different inputs could in theory produce the same hash, called a collision. For SHA-256 nobody has found one, so treat different hashes as proof of different inputs and equal hashes as equal inputs.",
    ]],
  ],
  misconception: "A hash is not an encrypted password. There is no key and no way back, so “decrypting” a stored hash is impossible; the server can only hash a new attempt and compare.",
  takeaway: "A hash is a one-way fingerprint: the same input always gives the same output, and the output cannot be turned back into the input.",
},

salts: {
  overview: "A salt is random extra text mixed into a password before hashing. Without one, everybody who uses the same password gets the same hash, so one precomputed table cracks them all. With a salt, equal passwords hash differently. BCrypt creates a salt for you and stores it inside its output.",
  goals: [
    "Explain what goes wrong when two users share an unsalted hash.",
    "Describe how a salt changes the hash and where it is kept.",
    "Say why `matches` can still verify a salted password.",
  ],
  diagram: ["Hashing “pw” with two different salts", [
    ["Salt s1 + password pw", "The text to hash becomes s1pw."],
    ["Salt s2 + password pw", "The text to hash becomes s2pw."],
    ["Different inputs", "So SHA-256 gives two unrelated hashes."],
    ["Store the salt with the hash", "For example s1:<hash>. The salt is not secret."],
    ["Login re-applies the salt", "Read s1 from the stored value, hash s1 + attempt, and compare."],
  ]],
  sections: [
    ["The problem with plain hashes", [
      "If two users both choose `password123`, a plain hash stores identical fingerprints for them. Anyone who sees the database can tell they share a password.",
      "Attackers also prepare tables of hashes of popular passwords ahead of time, called rainbow tables. One lookup in such a table reveals every account with that password.",
      "Both problems have the same cause: the hash depends on the password alone.",
    ]],
    ["A salt makes each hash unique", [
      "A salt is a random piece of text created for each password. It is joined to the password before hashing, so the input is different even when the passwords are the same.",
      "The salt is stored next to the hash. It is not a secret. Its job is only to make the stored hash unique and to make precomputed tables useless.",
      "BCrypt does all of this for you. Its output, `$2a$10$<salt><hash>`, carries its own salt and a cost setting, and `matches` reads the salt back out to check a login.",
    ], "String stored = salt + \":\" + sha256(salt + password);\n// s1:<64 hex characters>"],
  ],
  walkthrough: ["Tracing the example", [
    ["\"s1:\" + sha256(\"s1pw\")", "The example joins the salt s1 and the password pw into \"s1pw\", and hashes that."],
    ["sha256(\"s1pw\")", "SHA-256 returns 64 hex characters, as in the hashing lesson."],
    ["stored = \"s1:\" + ...", "The salt and a colon are put in front of the hash so the salt can be found again. The stored value is 3 + 64 characters long."],
    ["stored.substring(0, 3)", "The first three characters are the salt and the colon, so the program prints: s1:"],
    ["stored.length()", "3 characters of prefix plus 64 of hash is 67. The program prints: 67"],
  ]],
  deeper: [
    ["How matches checks a login", [
      "At login `matches(raw, stored)` reads the salt out of the stored value, hashes the typed password with that same salt, and compares the result to the stored hash. That is why the salt must be kept with the hash.",
    ]],
    ["What BCrypt adds", [
      "BCrypt is deliberately slow, and it has a cost number (the `10` in `$2a$10$`) you can raise as computers get faster. Each call to `encode` also makes a fresh random salt, so encoding the same password twice gives two different strings that both match.",
    ]],
    ["Common bug: comparing two encoded strings", [
      "Because each encoding uses a new salt, `encode(\"pw\").equals(encode(\"pw\"))` is false. Never compare hashes yourself. Use `passwordEncoder.matches(raw, stored)`.",
    ]],
    ["Salt versus secret key", [
      "A salt is public and different per password. A secret key, like the one that signs a JWT, is private and shared by the whole server. Do not mix them up. See \"A JWT is readable JSON plus a signature\".",
    ]],
  ],
  misconception: "A salt is not a secret password. It sits in plain view beside the hash, and it protects users by making each hash unique, not by being hidden.",
  takeaway: "A salt is random text added before hashing so equal passwords get different hashes. BCrypt stores the salt inside its output.",
},

"jwt-structure": {
  overview: "A JWT (JSON Web Token) is a string made of three parts separated by dots: a header, a payload, and a signature. After login the server gives the browser one, and the browser sends it back to prove who the user is. The header and payload are readable JSON; the signature proves nobody changed them.",
  goals: [
    "Name the three parts of a JWT and what each holds.",
    "Decode a token's payload and read claims like sub and exp.",
    "Explain why a JWT is signed but not secret.",
  ],
  diagram: ["The three parts of a token", [
    ["header", "{\"alg\":\"HS256\",\"typ\":\"JWT\"}: which signing method was used."],
    ["payload", "{\"sub\":\"ana@utdallas.edu\",\"exp\":1800000000}: who, and when it expires."],
    ["signature", "A fingerprint of header.payload made with the server's secret key."],
    ["Joined with dots", "header.payload.signature, each part Base64-encoded."],
    ["Sent to the browser", "After login. The browser keeps it and sends it with later requests."],
  ]],
  sections: [
    ["Header, payload, signature", [
      "The header is a small piece of JSON naming the algorithm, here `HS256`. The payload is JSON with claims, facts about the user: `sub` (subject, the user's email) and `exp` (expiry time, in seconds since 1970).",
      "Each of these two is turned into text with Base64URL, a way to write any characters using only letters, digits, `-` and `_`. This is an encoding, not encryption. Anyone can decode it.",
      "The signature is computed from the header and payload with a secret key that only the server knows. It is the third part after the second dot.",
    ], "eyJhbGciOi... . eyJzdWIiOi... . kJf3x...\n  header          payload       signature"],
    ["Signed, not secret", [
      "Anyone holding a token can decode it and read the payload, so never put passwords or private details in a JWT. Putting a token into a decoder website shows the claims.",
      "What the signature gives you is tamper detection. If someone changes the payload, the signature no longer matches, and the server rejects the token. The next lesson shows that check.",
      "`generateToken` in JwtService builds the payload with `sub`, `iat` (issued at), and `exp`, then signs it with the secret key.",
    ]],
  ],
  walkthrough: ["Tracing the example", [
    ["b64(\"{\\\"alg\\\":\\\"HS256\\\",\\\"typ\\\":\\\"JWT\\\"}\")", "The header JSON is converted to Base64URL text. This is the first part of the token."],
    ["b64(\"{\\\"sub\\\":\\\"ana@utdallas.edu\\\",\\\"exp\\\":1800000000}\")", "The payload JSON is encoded the same way: the user is ana@utdallas.edu, expiring at second 1800000000 (early 2027). This is the second part."],
    ["sign(header + \".\" + payload, secret)", "HMAC-SHA256 with the secret computes the signature of the first two parts joined with a dot. This is the third part."],
    ["token = header + \".\" + payload + \".\" + signature", "The three parts are joined with dots into one string."],
    ["token.split(\"\\\\.\")", "Splitting on dots gives an array of 3 parts, so the program prints: 3"],
    ["unb64(parts[1])", "Decoding the second part reverses the Base64URL and prints: {\"sub\":\"ana@utdallas.edu\",\"exp\":1800000000}"],
  ]],
  deeper: [
    ["Base64URL is not encryption", [
      "Base64URL just rewrites bytes using 64 safe characters so the token can travel in a header or URL. Decoding needs no key. The example's `unb64` can read any token's payload, which is the point of the lesson.",
    ]],
    ["What HMAC-SHA256 means", [
      "HMAC mixes a secret key into a hash. Only someone with the key can produce the right signature for a given header and payload. The secret should be at least 32 bytes and kept out of git, which is why it belongs in configuration (known issue #2).",
    ]],
    ["Common bug: trusting the payload before checking", [
      "Reading `sub` out of a token without verifying the signature lets anyone claim to be anybody, because they can write any payload. Always verify first. See \"Verify a token's signature before trusting it\".",
    ]],
    ["Why split uses two backslashes", [
      "`split` takes a regular expression, and `.` normally means “any character”. To split on a real dot you write `\\\\.` in Java source: the regex `\\.`, with each backslash doubled because Java strings use backslash too.",
    ]],
  ],
  misconception: "A JWT is not encrypted. Anyone who has it can read the payload. The signature only guarantees that the contents have not been changed.",
  takeaway: "A JWT is header.payload.signature: two readable JSON parts, plus a signature that proves they were not altered.",
},

"jwt-verify": {
  overview: "Verifying a token means recomputing its signature with the server's secret key and checking that it equals the signature in the token. If someone edits the payload or signs with a different key, the signatures differ and the token is rejected. Only a verified token's claims may be trusted.",
  goals: [
    "Explain how recomputing a signature detects tampering.",
    "Predict whether a forged or re-keyed token is accepted.",
    "Say what else must be checked after the signature, such as expiry.",
  ],
  diagram: ["Verifying an incoming token", [
    ["Split the token", "Separate header, payload, and the signature the sender supplied."],
    ["Recompute the signature", "Sign header.payload yourself using the server's secret key."],
    ["Compare", "Is your signature equal to the supplied one?"],
    ["Equal: check expiry", "Is the exp time still in the future?"],
    ["Trust the claims", "Only now may the server believe sub."],
  ]],
  sections: [
    ["Recompute and compare", [
      "When a token arrives, the server cannot just believe it. Anyone can write a payload such as `{\"sub\":\"admin\"}`, so the claims mean nothing yet.",
      "The server takes the first two parts, signs them again with its own secret key, and compares the result to the third part of the token. This is the verification.",
      "A signature depends on every character of the signed text and on the key. Change one letter of the payload, or use a different key, and the result is completely different.",
    ], "String signature = sign(header + \".\" + payload, secret);\nboolean ok = signature.equals(tokenSignature);"],
    ["Verify first, then trust", [
      "Only when the signatures match may the server read `sub` and treat that user as logged in. A forged `{\"sub\":\"admin\"}` payload fails because the attacker cannot produce the matching signature without the key.",
      "Matching is not the end. A valid token also has an `exp` claim, and a token whose time has passed must be refused even though its signature is correct.",
      "In real code a library does these steps. JJWT's parser checks the signature and the expiry, and throws an exception if either fails, so a bad token never reaches your code.",
    ]],
  ],
  walkthrough: ["Tracing the example", [
    ["String body = \"h.p\";", "A tiny stand-in for “header.payload”, the text that gets signed."],
    ["String sig = sign(body, \"k\");", "The sender signs it with the key k. This signature travels with the token."],
    ["sign(\"h.p\", \"k\")", "The server recomputes the signature of the same text with the same key. The result is identical."],
    ["... .equals(sig) ? \"valid\" : \"rejected\"", "The two signatures are equal, so the program prints: valid"],
    ["sign(\"h.q\", \"k\")", "Now the payload part was changed from p to q. The recomputed signature is completely different."],
    ["... .equals(sig) ? \"valid\" : \"rejected\"", "It no longer equals the signature in the token, so the program prints: rejected"],
  ]],
  deeper: [
    ["Common bug: skipping verification", [
      "Decoding a token and trusting `sub` without verifying is the classic JWT mistake. It compiles and works in testing with real tokens, yet any user can forge a token for any account. Verification is the whole point of signing.",
    ]],
    ["Compare signatures safely", [
      "Real code compares signatures with a method that takes the same time however many characters match, such as `MessageDigest.isEqual`. A plain `equals` stops at the first difference, which can leak information to a determined attacker. A library handles this for you.",
    ]],
    ["Expiry", [
      "After the signature, check `exp` against the current time, using the Instant ideas in \"Instant + Duration computes deadlines\". An expired token is a normal case: the browser should send the user to log in again.",
    ]],
    ["Changing the key logs everyone out", [
      "If the server's secret changes, every old token fails verification. That is a feature when a key leaks, and a surprise if you change it by accident. See the properties lesson about keeping secrets in configuration.",
    ]],
  ],
  misconception: "A token that decodes cleanly is not necessarily real. Anyone can write valid-looking JSON, so a token is trustworthy only after its signature has been verified.",
  takeaway: "Recompute the signature with your secret key and compare. Only a token that passes, and is not expired, may be trusted.",
},

bearer: {
  overview: "After login the React app sends the token on every request in a header named `Authorization`, with the value `Bearer ` followed by the token. “Bearer” means whoever bears (holds) the token is treated as the user. The server's first job is to pull the token out safely.",
  goals: [
    "Read an `Authorization: Bearer ...` header.",
    "Extract the token with `startsWith` and `substring(7)`.",
    "Handle a missing or malformed header without crashing.",
  ],
  diagram: ["From header to token", [
    ["Request arrives", "It carries headers, such as Authorization: Bearer eyJ..."],
    ["Read the header value", "The server asks for the Authorization header. It may be absent (null)."],
    ["Check the prefix", "A usable header starts with \"Bearer \", including the space."],
    ["Cut the prefix off", "substring(7) skips the 7 prefix characters."],
    ["Return the token", "The rest is the token, ready to verify."],
  ]],
  sections: [
    ["What the header looks like", [
      "An HTTP request carries headers, extra named values beside the path. The `Authorization` header is where credentials go. After a login the browser sends `Authorization: Bearer eyJhbGci...` on every call.",
      "The word `Bearer` names the kind of credential, followed by one space, then the token itself. The server uses this to know who is calling without a password each time.",
      "The header can also be missing, for example on a request from a user who is not logged in. The server must handle that case.",
    ], "Authorization: Bearer abc.def.ghi"],
    ["Extracting the token", [
      "`header == null` is checked first, because calling `startsWith` on null would crash. `!header.startsWith(\"Bearer \")` rejects headers in any other format.",
      "`\"Bearer \"` has 7 characters, six letters and one space. `header.substring(7)` returns everything from the eighth character, which is the token.",
      "The example returns `\"none\"` when there is no usable token, so the caller can tell that nobody is logged in.",
    ], "if (header == null || !header.startsWith(\"Bearer \")) return \"none\";\nreturn header.substring(7);"],
  ],
  walkthrough: ["Tracing the example", [
    ["token(\"Bearer xyz\")", "The header value is the 10 characters Bearer xyz."],
    ["header == null || !header.startsWith(\"Bearer \")", "The value is not null and does start with the prefix, so both parts are false and the method continues."],
    ["header.substring(7)", "The first 7 characters, Bearer and a space, are skipped. What remains is xyz, and the program prints: xyz"],
    ["token(null)", "No Authorization header was sent, so the parameter is null."],
    ["header == null", "True, so `||` stops here without calling startsWith, which would crash on null. The method returns none, and the program prints: none"],
  ]],
  deeper: [
    ["Common bug: lowercase or missing space", [
      "`startsWith` is case-sensitive, so `bearer abc` fails the check, as the predict step shows. A header of just `Bearer ` passes the check but gives an empty token, which must also be treated as no token.",
    ]],
    ["Why the token goes in a header", [
      "Browsers add headers to requests from your code, so the React app can attach the token to every call. Putting the token in the URL is a bad idea, because URLs end up in logs and browser history.",
    ]],
    ["Where the browser keeps the token", [
      "After login the React app has to store the token somewhere, such as memory or local storage, and add the header to each request. Whoever has the token can use it, which is exactly what “bearer” means, so keep it private and use HTTPS.",
    ]],
    ["Who does this in Spring", [
      "Spring does not read this header automatically. A filter you write does: see \"Every request walks the security filter chain\". It calls code like this, then verifies the token as in the previous lesson.",
    ]],
  ],
  misconception: "The token is not the whole header value. The header is `Bearer xyz`, and the token is only `xyz`, so the prefix must be removed before verifying.",
  takeaway: "The header is Authorization: Bearer <token>. Check for null and the prefix, then substring(7) gives the token.",
},

"auth-status": {
  overview: "Security failures have two different HTTP status codes. 401 Unauthorized means the server does not know who you are, so log in. 403 Forbidden means it knows who you are but you are not allowed to do this. The order of checks decides which one you send.",
  goals: [
    "Say the difference between authentication and authorization.",
    "Choose 401 or 403 for a given request.",
    "Order the checks so the right one fires first.",
  ],
  diagram: ["Two questions, asked in order", [
    ["Is the caller logged in?", "Authentication: do we know who this is?"],
    ["No: 401", "“Who are you?” The client should log in and try again."],
    ["Yes: is this action allowed?", "Authorization: may this user do this?"],
    ["No: 403", "“Not allowed.” Logging in again will not help."],
    ["Yes: 200", "The request goes ahead."],
  ]],
  sections: [
    ["Authentication and authorization", [
      "Authentication means proving who you are, for example with a valid token. Authorization means checking what that known person may do, for example only an ADMIN may see reports.",
      "They are two separate steps, and authentication must come first. You cannot decide what someone is allowed to do until you know who they are.",
      "Each step has its own failure code, so the client can react correctly.",
    ]],
    ["401 versus 403", [
      "401 is returned when authentication fails or is missing: an anonymous visitor to `/api/admin/reports`. The correct client response is to show the login page.",
      "403 is returned when authentication worked but authorization failed: a logged-in RIDER visiting the admin reports. Showing a login page would be wrong here, because they already are logged in.",
      "The example checks `!loggedIn` first and returns 401, then `!allowed` and returns 403. Swapping the order would tell anonymous users “not allowed”, which is misleading.",
    ], "if (!loggedIn) return 401;   // who are you?\nif (!allowed)  return 403;   // you can't do this\nreturn 200;"],
  ],
  walkthrough: ["Tracing the three calls in main", [
    ["status(false, false)", "loggedIn is false, so the first check triggers immediately."],
    ["if (!loggedIn) return 401;", "The method returns 401 without even looking at `allowed`. The program prints: 401"],
    ["status(true, false)", "The caller is logged in but not allowed, like a RIDER on an admin page."],
    ["if (!allowed) return 403;", "The first check passes, since !loggedIn is false. The second triggers, so the program prints: 403"],
    ["status(true, true)", "Both checks pass, and the method reaches the final line: return 200. The program prints: 200"],
  ]],
  deeper: [
    ["The confusing name", [
      "The official name of 401 is “Unauthorized”, but it really means unauthenticated. The code that means “unauthorized” in everyday speech is 403. Remember them as 401: who are you, 403: not allowed.",
    ]],
    ["Roles drive 403", [
      "In CometCarpool a user has a role, an enum with RIDER, DRIVER, and ADMIN. Authorization rules compare that role with what an endpoint needs, as in `adminOnly(role)` in the predict step. See \"An enum is a fixed set of named values\".",
    ]],
    ["Common bug: a valid token still gets 401", [
      "If nothing reads the token and logs the user in for the request, every request looks anonymous, so protected routes answer 401 even with a good token. That is known issue #1, covered in the next lesson.",
    ]],
    ["Hiding that something exists", [
      "Sometimes a server answers 404 instead of 403 so outsiders cannot learn that a resource exists. That is a deliberate choice; by default, use 403 when the user is known but not permitted.",
    ]],
  ],
  misconception: "401 and 403 are not interchangeable. 401 tells the client to authenticate, and 403 tells it that authenticating again will not help.",
  takeaway: "Check who the caller is first and answer 401 if unknown. Then check what they may do and answer 403 if not allowed.",
},

"filter-chain": {
  overview: "A filter is code that sees every web request before the controller does. Spring Security runs each request through an ordered list of filters, the filter chain. CometCarpool has no filter that reads the JWT yet, so even a valid token is never turned into a logged-in user.",
  goals: [
    "Describe a request passing through a series of filters.",
    "Explain why a JWT filter must run before the authorization step.",
    "Predict what happens when no filter reads the token.",
  ],
  diagram: ["A request walking the chain", [
    ["Request arrives", "GET /api/rides with Authorization: Bearer <token>."],
    ["Filters run in order", "Each one may inspect, change, or stop the request."],
    ["JWT filter", "Reads the token, verifies it, and records “this is Ana” for this request."],
    ["Authorization step", "Is the rule for /api/rides satisfied by a logged-in user?"],
    ["Controller", "Only reached if every earlier step let the request through."],
  ]],
  sections: [
    ["Filters in a row", [
      "A filter is a piece of code that every request passes through before reaching a controller. The chain is the ordered list of filters. Each filter does one job and then passes the request along, or stops it.",
      "Spring Security's own filters handle things like turning CSRF protection on or off. The last important step checks the rules you set, such as “/api/rides needs a logged-in user”.",
      "`SecurityConfig` builds a `SecurityFilterChain` bean. Its lambdas, like `csrf -> csrf.disable()`, configure that chain, tying back to the lambdas lesson.",
    ]],
    ["The missing JWT filter", [
      "Nothing in Spring knows how to read your token. Bearer headers, signatures, and `sub` claims are your design, so you must add a filter that does it: extract the token, verify it, and mark the request as authenticated.",
      "Today SecurityConfig has no such filter. A request with a perfectly valid token reaches the authorization step with nobody logged in, so any route that requires authentication fails. This is known issue #1.",
      "The new filter must sit before the authorization step, so that by the time the rules run, they already know who the user is. You place it with `http.addFilterBefore(...)`.",
    ], "http.addFilterBefore(jwtFilter,\n    UsernamePasswordAuthenticationFilter.class);"],
  ],
  walkthrough: ["One request, without and with a JWT filter", [
    ["GET /api/rides + Authorization: Bearer <valid token>", "Ana's browser sends a request carrying a token that was signed by the server a minute ago."],
    ["Today: Spring's filters run", "None of them looks at the Bearer header, so nothing records who Ana is."],
    ["Authorization step", "The rule says /api/rides requires authentication. The request has no logged-in user, so Spring rejects it, and the controller never runs."],
    ["After the fix: JWT filter runs first", "The filter takes the header, extracts the token as in the bearer lesson, and verifies the signature and expiry."],
    ["Filter records the user", "The filter stores “Ana, role RIDER” as the authenticated user for this request and passes the request on."],
    ["Authorization step again", "Now a logged-in user is present, so the rule is satisfied. The request reaches the controller."],
  ]],
  deeper: [
    ["Filters versus controllers", [
      "A filter works on every request regardless of path, before any controller is chosen. A controller handles one specific path. Cross-cutting jobs like authentication belong in filters, so you do not repeat them in every controller.",
    ]],
    ["OncePerRequestFilter", [
      "A custom filter usually extends `OncePerRequestFilter`, a Spring class that guarantees one run per request. Inside, it calls `filterChain.doFilter(request, response)` to pass the request to the next filter. Forgetting that call stops the request there, so nothing is ever answered.",
    ]],
    ["Where the logged-in user is kept", [
      "The filter records the user in Spring's `SecurityContextHolder`, which holds the current request's authentication. Later steps and your controllers read from it. It is cleared after each request, so one user never sees another's data.",
    ]],
    ["Order matters", [
      "A filter placed after the authorization step is useless: the decision has already been made. If a valid token is rejected, check the filter order first. See \"401 means who are you; 403 means not allowed\" for the codes the rejection sends.",
    ]],
  ],
  misconception: "Spring does not read your JWT on its own. Sending a valid token does nothing until you add a filter that verifies it and records the user.",
  takeaway: "Every request passes through the filter chain in order. A JWT filter must run before the authorization step, or valid tokens never log anyone in.",
},

};
