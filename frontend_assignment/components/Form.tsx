import {
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import { object, string, number } from "yup";

const SignupSchema = object().shape({
  name: string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Name required!"),

  age: number().required("Age is required!").positive().integer(),
  address: string()
    .required("Address required!")
    .matches(/^0x[a-fA-F0-9]{40}$/),
});

export function MyForm() {
  return (
    <Formik
      initialValues={{
        name: "",
        age: 0,
        address: "",
      }}
      validationSchema={SignupSchema}
      onSubmit={(values, actions) => {
        console.log(values);
        actions.resetForm();
      }}
    >
      {({ errors, touched, isValidating }) => (
        <Form>
          <VStack spacing={4} align="flex-start">
            <FormControl>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Field name="name" as={Input} variant="filled" />
              <Text as={"div"} color="red.400">
                {errors.name && touched.name ? <p>{errors.name}</p> : null}
              </Text>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="age">Age</FormLabel>
              <Field name="age" as={Input} variant="filled" />
              <Text as={"div"} color="red.400">
                {errors.age && touched.age ? <p>{errors.age}</p> : null}
              </Text>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="address">Address</FormLabel>
              <Field name="address" as={Input} variant="filled" />
              <Text as={"div"} color="red.400">
                {errors.address && touched.address ? (
                  <p>{errors.address}</p>
                ) : null}
              </Text>
            </FormControl>
            <Button
              type="submit"
              colorScheme="purple"
              width="full"
              isLoading={isValidating}
            >
              Submit
            </Button>
          </VStack>
        </Form>
      )}
    </Formik>
  );
}
