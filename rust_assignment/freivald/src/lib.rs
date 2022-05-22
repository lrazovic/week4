use ark_bls12_381::Fq as F;
use ark_std::rand::random;
use ndarray::{Array1, Array2};

pub struct Freivald {
    x: Vec<Array1<F>>,
}

impl Freivald {
    /// Populate vector with values r^i for i=0..matrix_size
    /// Creates a new [`Freivald`] value with this vector as its x value
    #[must_use]
    pub fn new(array_size: usize) -> Self {
        Self::with_vectors(array_size, 1)
    }

    #[must_use]
    pub fn with_vectors(array_size: usize, verification_vectors: usize) -> Self {
        let x: Vec<Array1<F>> = (0..verification_vectors)
            .map(|_| Self::random_vector(array_size))
            .collect();
        Self { x }
    }

    fn random_vector(n: usize) -> Array1<F> {
        let mut r = random();
        let mut a = Array1::<F>::zeros(n);
        a.iter_mut().for_each(|x| {
            *x = r;
            r *= r
        });
        a
    }

    #[must_use]
    pub fn verify(
        &self,
        matrix_a: &Array2<F>,
        matrix_b: &Array2<F>,
        supposed_ab: &Array2<F>,
    ) -> bool {
        assert!(check_matrix_dimensions(matrix_a, matrix_b, supposed_ab));
        for v in &self.x {
            let left = matrix_a.dot(&matrix_b.dot(v));
            let right = supposed_ab.dot(v);
            if left != right {
                return false;
            }
        }
        true
    }

    #[must_use]
    pub fn verify_once(
        matrix_a: &Array2<F>,
        matrix_b: &Array2<F>,
        supposed_ab: &Array2<F>,
    ) -> bool {
        let freivald = Freivald::new(supposed_ab.nrows());
        freivald.verify(matrix_a, matrix_b, supposed_ab)
    }
}

/// Check if dimensions of making `matrix_a` * `matrix_b` matches values in `supposed_ab`.
#[must_use]
pub fn check_matrix_dimensions(
    matrix_a: &Array2<F>,
    matrix_b: &Array2<F>,
    supposed_ab: &Array2<F>,
) -> bool {
    (matrix_a.dim() == matrix_b.dim()) && (matrix_a.dim() == supposed_ab.dim())
}

#[cfg(test)]
mod tests {
    use lazy_static::lazy_static;
    use ndarray::Array2;
    use rstest::rstest;

    use super::*;

    lazy_static! {
        static ref SIZE: usize = 256;
        static ref MATRIX_A: Array2<F> = random_matrix(*SIZE);
        static ref MATRIX_A_DOT_A: Array2<F> = dot(&MATRIX_A, &MATRIX_A);
        static ref MATRIX_B: Array2<F> = random_matrix(*SIZE);
        static ref MATRIX_B_DOT_B: Array2<F> = dot(&MATRIX_B, &MATRIX_B);
        static ref MATRIX_C: Array2<F> = random_matrix(*SIZE);
        static ref MATRIX_C_DOT_C: Array2<F> = dot(&MATRIX_C, &MATRIX_C);
    }

    #[rstest]
    #[case(&MATRIX_A, &MATRIX_A, &MATRIX_A_DOT_A)]
    #[case(&MATRIX_B, &MATRIX_B, &MATRIX_B_DOT_B)]
    #[case(&MATRIX_C, &MATRIX_C, &MATRIX_C_DOT_C)]
    fn freivald_verify_success_test(
        #[case] matrix_a: &Array2<F>,
        #[case] matrix_b: &Array2<F>,
        #[case] supposed_ab: &Array2<F>,
    ) {
        let freivald = Freivald::new(supposed_ab.nrows());
        assert!(freivald.verify(matrix_a, matrix_b, supposed_ab));
    }

    #[rstest]
    #[case(&MATRIX_A, &MATRIX_B, &MATRIX_A_DOT_A)]
    #[case(&MATRIX_B, &MATRIX_A, &MATRIX_B_DOT_B)]
    #[case(&MATRIX_C, &MATRIX_B, &MATRIX_C_DOT_C)]
    fn freivald_verify_fail_test(
        #[case] a: &Array2<F>,
        #[case] b: &Array2<F>,
        #[case] c: &Array2<F>,
    ) {
        let freivald = Freivald::new(c.nrows());
        assert!(!freivald.verify(a, b, c));
    }

    fn random_matrix(n: usize) -> Array2<F> {
        let mut r = random();
        let mut a = Array2::<F>::zeros((n, n));
        a.iter_mut().for_each(|x| {
            *x = r;
            r *= r
        });
        a
    }

    fn dot(a: &Array2<F>, b: &Array2<F>) -> Array2<F> {
        a.dot(b)
    }
}
