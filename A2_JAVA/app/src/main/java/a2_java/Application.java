package a2_java;


import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class Application {
    public static void main(String[] args) {
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);

        HelloWorldService helloWorldService = context.getBean(HelloWorldService.class);

        helloWorldService.sayHello();
    }
}
