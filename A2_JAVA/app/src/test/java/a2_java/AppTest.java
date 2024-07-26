package a2_java;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

class AppTest {

    @Test 
    void testHelloWorldService() {
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);

        HelloWorldService helloWorldService = context.getBean(HelloWorldService.class);

        assertNotNull(helloWorldService, "HelloWorldService bean should not be null");

        ByteArrayOutputStream outContent = new ByteArrayOutputStream();
        PrintStream originalOut = System.out;
        System.setOut(new PrintStream(outContent));

        try {
            helloWorldService.sayHello();

            String expectedOutput = "Hello, World!" + System.lineSeparator();
            String actualOutput = outContent.toString();
            assertEquals(expectedOutput, actualOutput, "Method should print 'Hello, World!'");
        } finally {
            System.setOut(originalOut);
        }
    }
}
