import { Button, Text, Paper, PasswordInput, Image, TextInput, Title, Divider } from '@mantine/core';
import classes from './login.module.css';
import logo from '@assets/logo40x40.svg';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from '@mantine/form';
import { useAuth } from '@/context/AuthContext';

const Login = () => {

     const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const loginForm = useForm({
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: (val: string) => (/^\S+@\S+$/.test(val) ? null : 'Neplatná emailová adresa'),
            password: (val: string) => (val.length < 6 ? 'Heslo musí obsahovat alespoň 6 znaků' : null),
        },
    });

    const handleSubmit = async (values: typeof loginForm.values) => {
        setError(null);
        setIsSubmitting(true);

        try {
            await login(values.email, values.password);
            navigate('/overview');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Špatné přihlašovací údaje');
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
  <div className={classes.wrapper}>
            <Paper className={classes.form}>
                <form onSubmit={loginForm.onSubmit(handleSubmit)}>
                    <div>
                        <Image src={logo} alt="Logo" width={100} height={100} fit="contain" />
                        <Title order={2} className={classes.title} fw="bold">
                            Blue Horses Stochov
                        </Title>

                        <TextInput
                            label="Email address"
                            placeholder="bluehorses@gmail.com"
                            size="md"
                            radius="md"
                            value={loginForm.values.email}
                            onChange={(event) => loginForm.setFieldValue('email', event.currentTarget.value)}
                            error={loginForm.errors.email}
                        />
                        <PasswordInput
                            label="Password"
                            placeholder="Your password"
                            mt="md"
                            size="md"
                            radius="md"
                            value={loginForm.values.password}
                            onChange={(event) => loginForm.setFieldValue('password', event.currentTarget.value)}
                            error={loginForm.errors.password}
                        />

                        {error && (
                            <Text size="sm" mt="md" c="red" ta="center">
                                {error}
                            </Text>
                        )}

                        <Button fullWidth mt="xl" size="md" radius="md" type="submit" loading={isSubmitting}>
                            Login
                        </Button>

                        <Text size="sm" mt="md" c="dimmed" ta="center">
                            <a href="/fan" style={{ color: 'inherit', fontWeight: 500 }}>Navštiv sekci pro fanoušky</a> pro informace o zápasech a aktuality týmu.
                        </Text>
                    </div>
                </form>

                <div>
                    <Divider mb="md" />
                    <Text size="xs" c="dimmed" ta="center">
                        Powered by SpravujTym
                    </Text>
                </div>
            </Paper>
        </div>
  )
}

export default Login