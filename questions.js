// ===== Helper Functions =====
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randNonZero(min, max) { let n = 0; while (n === 0) n = randInt(min, max); return n; }
function randIntFromTwoRanges(min1, max1, min2, max2) {
    return Math.random() < 0.5 ? randInt(min1, max1) : randInt(min2, max2);
}

// ===== CATEGORY DATA STRUCTURE =====
const categories = [
    {
        id: 'Linear Properties From Two Points',
        title: '(Easy) Linear Properties from Two Points',
        difficulty: 'easy',
        perfectTime: 60,
        tips: [
            "You can write 'table' or do Ctrl+Alt+T in Desmos instead of clicking '+' then 'table'",
            "You can go to the next cell by pressing the 'Tab' key",
            "Use the two points to find the slope, then use one point to find the y-intercept. The x-intercept is found by setting y=0 in the equation.",
            "The slope will be 'b', the y-intercept is the y-coordinate at which the line intersects the y-axis and the x-intercept is the x-coordinate at which the line intersects the x-axis"
        ],
        explanationImage: 'https://i.ibb.co/hxVms1q2/Linear-Properties-from-Two-Points-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let x1, y1, x2, y2, m, b;
            while (true) {
                m = randNonZero(-5, 5);
                b = randNonZero(-10, 10);
                if (b % m === 0) {
                    x1 = randNonZero(-10, 10);
                    y1 = m * x1 + b;
                    let tempX2;
                    do { tempX2 = randNonZero(-10, 10); } while (tempX2 === x1 || tempX2 === -b / m);
                    x2 = tempX2;
                    y2 = m * x2 + b;
                    break;
                }
            }
            const slope = m, yIntercept = b, xIntercept = -b / m;
            const questionType = randInt(0, 2);
            let questionText, answer;
            if (questionType === 0) {
                questionText = `A line passes through the points $$(${x1}, ${y1})$$ and $$(${x2}, ${y2})$$ What is the slope of the line?`;
                answer = slope;
            } else if (questionType === 1) {
                questionText = `A line passes through the points $$(${x1}, ${y1})$$ and $$(${x2}, ${y2})$$ What is the y-intercept of the line?`;
                answer = yIntercept;
            } else {
                questionText = `A line passes through the points $$(${x1}, ${y1})$$ and $$(${x2}, ${y2})$$ What is the x-intercept of the line?`;
                answer = xIntercept;
            }
            return { questionText, answer };
        }
    },

    {
        id: 'Trignometric Identity Evaluation',
        title: '(Easy) Trigonometric Identity Evaluation',
        difficulty: 'easy',
        perfectTime: 75,
        tips: [
            "Don't forget to set it to degrees through the wrench icon!",
            "the regression we run here is sin(a)~value and sin(b)~value",
            "After that, all you gotta do is plug in the value or do y₁ = value of y (you can't use y by itself in the equation! x and y cannot be used as regression terms)"
        ],
        explanationImage: 'https://i.ibb.co/mCV5z8c7/Trignometric-Identity-Evaluation-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            const generateRationalValue = () => {
                let numerator, denominator;
                do {
                    numerator = Math.floor(Math.random() * 90) + 1;
                    denominator = Math.floor(Math.random() * 90) + 1;
                } while (numerator >= denominator);
                return (numerator / denominator).toFixed(2);
            };
            const sinA_val = parseFloat(generateRationalValue());
            const cosB_val = parseFloat(generateRationalValue());
            const coeff1 = Math.floor(Math.random() * 4) + 2;
            const coeff2 = Math.floor(Math.random() * 4) + 2;
            let y_val = Math.floor(Math.random() * 31) - 15;
            if (y_val === 0) y_val = 1;
            const expression = `${coeff1} \\cos(90^\\circ - a) \\cos(b^\\circ) + ${coeff2} \\sin(a + y)^\\circ \\sin(90^\\circ - b)`;
            const cosA_val = Math.sqrt(1 - sinA_val * sinA_val);
            const sinB_val = Math.sqrt(1 - cosB_val * cosB_val);
            const term1 = coeff1 * sinA_val * cosB_val;
            const sin_a_plus_y = sinA_val * Math.cos(y_val * Math.PI / 180) + cosA_val * Math.sin(y_val * Math.PI / 180);
            const term2 = coeff2 * sin_a_plus_y * cosB_val;
            const answer = parseFloat((term1 + term2).toFixed(3));
            const questionText = `For the expression $$${expression}$$ where $$\\sin a^\\circ = ${sinA_val.toFixed(2)}$$ $$\\cos b^\\circ = ${cosB_val.toFixed(2)}$$ what is the value of the expression (to three decimal places) when y = ${y_val}?`;
            return { questionText, answer };
        }
    },

    {
        id: 'Simple Percentage Change',
        title: '(Easy) Simple Percentage Change',
        difficulty: 'easy',
        perfectTime: 45,
        tips: [
            "Here we can learn to use regressions and the desmos % of (typed with shift+5) built-in function to solve questions like these with Desmos",
            "Run a regression like '140% of x₁ ~ 77' when the value increases by 40%",
            "A percentage increase is calculated as: original value × (1 + percent/100)",
            "A percentage decrease is calculated as: original value × (1 - percent/100)"
        ],
        explanationImage: 'https://i.ibb.co/zhpSdvWh/Simple-Percentage-Change-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let x, percent, result, isIncrease;
            while (true) {
                x = randInt(1, 100);
                isIncrease = Math.random() < 0.5;
                percent = randInt(1, isIncrease ? 15 : 19) * 5;
                result = isIncrease ? x * (100 + percent) / 100 : x * (100 - percent) / 100;
                if (result % 1 === 0) break;
            }
            const questionText = isIncrease
                ? `The result of increasing the quantity x by ${percent}% is ${result}. What is the value of x?`
                : `The result of decreasing the quantity x by ${percent}% is ${result}. What is the value of x?`;
            return { questionText, answer: x };
        }
    },

    {
        id: 'Two points Non-linear',
        title: '(Medium) Two Points Non-Linear',
        difficulty: 'medium',
        perfectTime: 90,
        tips: [
            "A linear function f(x) has the form f(x) = mx + b. The y-intercept is b.",
            "Plot the points, then run a regression, replacing f(x) with mx+b",
            "You can write 'table' or do Ctrl+Alt+T in Desmos instead of clicking '+' then 'table'",
            "You can go to the next cell by pressing the 'Tab' key",
            "You can delete everything by clicking the gear then 'Delete All', or use the shortcut Ctrl+Shift+L"
        ],
        explanationImage: 'https://i.ibb.co/fsBx5kH/Two-points-Non-Linear-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let m, b, x1, x2, k1, k2, g_x1, g_x2, g_x1_num, g_x2_num;
            while (true) {
                m = randNonZero(-5, 5);
                b = randNonZero(-10, 10);
                x1 = randInt(-10, 10);
                x2 = randInt(-10, 10);
                k1 = randInt(-10, 10);
                k2 = randNonZero(-10, 10);
                while (x1 === -k2) x1 = randInt(-10, 10);
                while (x2 === x1 || x2 === -k2) x2 = randInt(-10, 10);
                g_x1_num = m * x1 + b + k1;
                g_x2_num = m * x2 + b + k1;
                if (g_x1_num % (x1 + k2) === 0 && g_x2_num % (x2 + k2) === 0) {
                    g_x1 = g_x1_num / (x1 + k2);
                    g_x2 = g_x2_num / (x2 + k2);
                    break;
                }
            }
            let k1_display = k1 > 0 ? ` + ${k1}` : k1 < 0 ? ` - ${Math.abs(k1)}` : '';
            let k2_display = k2 > 0 ? ` + ${k2}` : k2 < 0 ? ` - ${Math.abs(k2)}` : '';
            const questionText = `
            <p>Given that f(x) is a linear function and $$g(x) = \\frac{f(x) ${k1_display}}{x ${k2_display}}$$ Use the table of values given to find the y-intercept of the graph y = f(x)</p>
            <table class="q-table">
                <thead><tr><th>x</th><th>g(x)</th></tr></thead>
                <tbody>
                    <tr><td>$$${x1}$$</td><td>$$${g_x1}$$</td></tr>
                    <tr><td>$$${x2}$$</td><td>$$${g_x2}$$</td></tr>
                </tbody>
            </table>`;
            return { questionText, answer: b };
        }
    },

    {
        id: 'Circle Regression',
        title: '(Medium) Circle Regression',
        difficulty: 'medium',
        perfectTime: 90,
        tips: [
            "The standard form for the equation of a circle is (x+h)² + (y+k)²=r² where (h,k) is the centre",
            "Therefore, you can plot the circle just using the centre point given",
            "The next step is to plot at least three points that lie on a circle into a table, then run the regression using those points:",
            "The regression is x₁²+y₁²+ax₁+by₁+c~0",
            "You can write 'table' or do Ctrl+Alt+T in Desmos instead of clicking '+' then 'table'"
        ],
        explanationImage: 'https://i.ibb.co/ymSb2Zrk/Circle-Regression-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            const h = randInt(-10, 10), k = randInt(-10, 10), r = randInt(1, 10);
            const a = -2 * h, b = -2 * k, c = h * h + k * k - r * r;
            const options = ['a', 'b', 'c'];
            const questionType = options[Math.floor(Math.random() * options.length)];
            let questionText = '', answer = 0;
            switch(questionType) {
                case 'a':
                    questionText = `A circle has a center at (${h}, ${k}) and a radius of ${r}. An equation of this circle is $$x^2 + y^2 + ax + by + c = 0$$ What is the value of a?`;
                    answer = a; break;
                case 'b':
                    questionText = `A circle has a center at (${h}, ${k}) and a radius of ${r}. An equation of this circle is $$x^2 + y^2 + ax + by + c = 0$$ What is the value of b?`;
                    answer = b; break;
                case 'c':
                    questionText = `A circle has a center at (${h}, ${k}) and a radius of ${r}. An equation of this circle is $$x^2 + y^2 + ax + by + c = 0$$ What is the value of c?`;
                    answer = c; break;
            }
            return { questionText, answer };
        }
    },

    {
        id: 'Equivalent Expression Constants',
        title: '(Medium) Equivalent Expression Constants',
        difficulty: 'medium',
        perfectTime: 90,
        tips: [
            "Here, we can plug the equation given into desmos with 'x₁' instead of 'x' and '~' instead of '='",
            "However, this equation must be true for all values of x₁. Therefore, enter x₁ = [1...10] or something to that effect. After that, all we need to do is a+b+c"
        ],
        explanationImage: 'https://i.ibb.co/8Lv8bK8w/Equivalent-Expression-Constants.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let x2_coeff, x_coeff, const_term, p1, d1, e1, p2, d2, e2;
            do {
                do { p1 = randNonZero(-5, 5); } while (Math.abs(p1) === 1);
                do { d1 = randNonZero(-5, 5); } while (Math.abs(d1) === 1);
                e1 = randNonZero(-10, 10);
                do { p2 = randNonZero(-5, 5); } while (Math.abs(p2) === 1);
                do { d2 = randNonZero(-5, 5); } while (Math.abs(d2) === 1);
                e2 = randNonZero(-10, 10);
                x2_coeff = p1 * d1 * d1 + p2 * d2 * d2;
                x_coeff = p1 * 2 * d1 * e1 + p2 * 2 * d2 * e2;
                const_term = p1 * e1 * e1 + p2 * e2 * e2;
            } while (Math.abs(x2_coeff) <= 1 || Math.abs(x_coeff) <= 1 || Math.abs(const_term) <= 1);
            const d_a = randNonZero(2, 6), d_b = randNonZero(2, 6), d_c = randNonZero(2, 6);
            const a = x2_coeff * d_a, b = x_coeff * d_b, c = const_term * d_c;
            const sum = a + b + c;
            const p2_display = p2 < 0 ? `- ${Math.abs(p2)}` : `+ ${p2}`;
            const e1_display = e1 < 0 ? `- ${Math.abs(e1)}` : `+ ${e1}`;
            const e2_display = e2 < 0 ? `- ${Math.abs(e2)}` : `+ ${e2}`;
            const questionText = `If $$(\\frac{a}{${d_a}})x^2 + (\\frac{b}{${d_b}})x + \\frac{c}{${d_c}} = ${p1}(${d1}x ${e1_display})^2 ${p2_display}(${d2}x ${e2_display})^2$$ what is the sum of a+b+c?`;
            return { questionText, answer: sum };
        }
    },

    {
        id: 'Exponential Coefficients',
        title: '(Medium) Exponential Coefficients',
        difficulty: 'medium',
        perfectTime: 90,
        tips: [
            "In the SAT, they usually ask you which form displays c as a coefficient. Remember that, in some questions, the coefficient of the exponent could count!.",
            "What we can do here is plug in one of the forms (they're all equivalent)",
            "After that, run the regression 'f(a+increase)/f(a)~c' where the increase is the fraction by which 'x' increases to increase f(x) by a factor of 'c'. This will work for any value of 'a'"
        ],
        explanationImage: 'https://i.ibb.co/4Z3C3kGj/Exponential-Coefficients-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            const a = Math.floor(Math.random() * 50) + 10;
            let c_val, p_den, unit_base, exp_coeffs;
            do {
                const base_b_options = [8, 16, 27, 64, 81, 125, 216, 256, 343, 512, 729];
                unit_base = base_b_options[Math.floor(Math.random() * base_b_options.length)];
                const factors = [];
                for (let i = 2; i <= Math.sqrt(unit_base); i++) {
                    if (unit_base % i === 0) { factors.push(i); if (i !== unit_base / i) factors.push(unit_base / i); }
                }
                factors.sort((x, y) => x - y);
                const possible_exponents = new Set();
                for (let base of factors) {
                    const exp = Math.round(Math.log(unit_base) / Math.log(base));
                    if (Math.pow(base, exp) === unit_base && exp > 1) possible_exponents.add(exp);
                }
                possible_exponents.add(1);
                exp_coeffs = Array.from(possible_exponents);
                const valid_pairs = exp_coeffs.filter(exp => exp > 1);
                if (valid_pairs.length > 0) {
                    p_den = valid_pairs[Math.floor(Math.random() * valid_pairs.length)];
                    c_val = Math.pow(unit_base, 1 / p_den);
                }
            } while (!Number.isInteger(c_val) || exp_coeffs.length < 4);
            const exp_coeffs_to_use = exp_coeffs.filter(exp => exp !== p_den);
            const final_coeffs = [p_den, ...exp_coeffs_to_use.slice(0, 3)];
            const forms = [], used_bases = new Set();
            forms.push(`$$f(x) = ${a}(${c_val})^{${p_den}x}$$`);
            used_bases.add(c_val);
            for (let i = 1; i < final_coeffs.length; i++) {
                const exp_i = final_coeffs[i];
                const base_i = Math.round(Math.pow(unit_base, 1 / exp_i));
                if (!used_bases.has(base_i)) { forms.push(`$$f(x) = ${a}(${base_i})^{${exp_i}x}$$`); used_bases.add(base_i); }
                else forms.push(`$$f(x) = ${a}(${unit_base})^{x}$$`);
            }
            for (let i = forms.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [forms[i], forms[j]] = [forms[j], forms[i]];
            }
            const questionText = `For the function f, for every increase of 1/${p_den} in the value of x, the value of f(x) increases by a factor of c. The following forms of the function f are all equivalent.\n${forms[0]}\n${forms[1]}\n${forms[2]}\nWhat is the value of c?`;
            return { questionText, answer: c_val };
        }
    },

    {
        id: 'Complex Percentage Relationships',
        title: '(Medium) Complex Percentage Relationships',
        difficulty: 'medium',
        perfectTime: 90,
        tips: [
            "Here, we can use the same % of (typed with shift+5) built-in function that we did for Simple Percentage Change, but can we also use a slightly more complicated regression:",
            "To introduce this, [a,a]~[b+c,bc] would mean that we're telling Desmos to find values for a=b+c AND a=bc. If we say a=4, Desmos will say b=2 and c=2",
            "Using that kind of regression, we can run a = x₁% of b, a = x₂% of c, and c = (p/100)% of b where x₁ x₂ and the percentages given!",
        ],
        explanationImage: 'https://i.ibb.co/C30LbzJq/Complex-Percentage-Relationships-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let percent_ab, percent_ac, p;
            while (true) {
                percent_ab = randInt(50, 500);
                percent_ac = randInt(50, 500);
                p = (percent_ab / percent_ac) * 100;
                if (p % 1 === 0) break;
            }
            return { questionText: `The positive number a is ${percent_ab}% of the number b, and a is ${percent_ac}% of the number c. If c is p% of b, what is the exact value of p?`, answer: p };
        }
    },

    {
        id: 'Quadratic System of Equations',
        title: '(Medium) Quadratic System of Equations',
        difficulty: 'medium',
        perfectTime: 90,
        tips: [
            "This is another example where we can use the [a,a]~[b+c,bc] form of regression",
            "We can regress both expressions to the values they are made equal to, and then plot the first expression given",
            "After that, find the less positive or more positive value by plotting and checking x²+bx+c=0"
        ],
        explanationImage: 'https://i.ibb.co/VcTPtfH7/Quadratic-System-of-Equations-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let x1, x2;
            while (true) {
                x1 = randInt(-10, 10); x2 = randInt(-10, 10);
                const b = -(x1 + x2), c = x1 * x2;
                if (x1 !== x2 && b !== 0 && c !== 0) break;
            }
            const b = -(x1 + x2), c = x1 * x2;
            const discriminant = b * b - 4 * c;
            const numerator1 = -b + Math.sqrt(discriminant);
            const numerator2 = -b - Math.sqrt(discriminant);
            const askSmaller = Math.random() < 0.5;
            const answer = askSmaller ? Math.min(x1, x2) : Math.max(x1, x2);
            const questionText = `In the given equation $$x^2+bx+c = 0$$ b and c are constants. If: $$-b + \\sqrt{b^2 - 4c} = ${numerator1}$$ $$-b - \\sqrt{b^2 - 4c} = ${numerator2}$$ what is the ${askSmaller ? 'less positive' : 'more positive'} value of x?`;
            return { questionText, answer };
        }
    },

    {
        id: 'Parabola Symmetry (Vertex & Intercepts)',
        title: '(Medium) Parabola Symmetry (Vertex & Intercepts)',
        difficulty: 'medium',
        perfectTime: 75,
        tips: [
            "You don't really need a regression here, but this may be helpful practice for the Quadratic Regression Limit question category!",
            "If the question asks for the x-intercept, what we can do is say 'd'= the distance of an x-intercept from the vertex (a parabola is symmetrical so the distance will be the same for both x-intercepts)",
            "If the question asks for the vertex, you can simply run the midpoint function midpoint((x₁,0),(x₂,0)) to get the x coordinate of the vertex"
        ],
        explanationImage: 'https://i.ibb.co/7t6yBDJK/Parabola-Symmetry-Vertex-and-Intercepts.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let x1_intercept, x2_intercept;
            while (true) {
                x1_intercept = randInt(-15, 15); x2_intercept = randInt(-15, 15);
                if (x1_intercept !== x2_intercept) break;
            }
            const vertex_x = (x1_intercept + x2_intercept) / 2;
            const vertex_y = randInt(-10, 10);
            const askForVertex = Math.random() < 0.5;
            if (askForVertex) {
                return { questionText: `When the quadratic function f is graphed in the xy-plane, where y = f(x), its x-intercepts are (${x1_intercept}, 0) and (${x2_intercept}, 0). What is the x-coordinate of the vertex?`, answer: vertex_x };
            } else {
                return { questionText: `When the quadratic function f is graphed in the xy-plane, where y = f(x), its vertex is (${vertex_x}, ${vertex_y}). One of the x-intercepts of this graph is (${x1_intercept}, 0). What is the x-value of the other x-intercept of the graph?`, answer: x2_intercept };
            }
        }
    },

    {
        id: 'circle-radius-non-standard',
        title: '(Medium) Radius of Non-Standard Circle',
        difficulty: 'medium',
        perfectTime: 90,
        tips: [
            "Here, we can simply choose any value for 'p' and find the radius, then find 'n'",
            "To do this quickly with Desmos, we can plug in the equation, set a value for 'p', use the built-in distance() Desmos function and run a simple regression of np~radius to find 'n'",
            "Remember to use radius, not diameter!"
        ],
        explanationImage: 'https://i.ibb.co/MDbRthrX/Radius-of-Non-Standard-Circle-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let a, h, k, n;
            while (true) {
                a = randInt(2, 8); h = randInt(1, 10); k = randInt(1, 10); n = randInt(1, 10);
                if (n * n > h * h + k * k) break;
            }
            const b_coeff = -2 * a * h, c_coeff = -2 * a * k, d_const = a * (n * n - h * h - k * k);
            const equation = `$$${a}x^2 ${b_coeff < 0 ? `- ${Math.abs(b_coeff)}` : `+ ${b_coeff}`}px + ${a}y^2 ${c_coeff < 0 ? `- ${Math.abs(c_coeff)}` : `+ ${c_coeff}`}py = ${d_const < 0 ? `- ${Math.abs(d_const)}` : d_const}p^2$$`;
            return { questionText: `In the xy-plane, the graph of the given equation is a circle. The length of the radius of the circle is np, where n and p are positive constants. What is the value of n? ${equation}`, answer: n };
        }
    },

    {
        id: 'Trinomial Factoring',
        title: '(Medium) Trinomial Factoring',
        difficulty: 'medium',
        perfectTime: 75,
        tips: [
            "For this question, you don't need any fancy regressions",
            "Consider a trinomial expressed in the form (x+a)(x+b)(x+c) where a b and c are NOT coefficients of x³ x² and x",
            "The roots of the trinomial expression given will be possible values of 'b' multiplied by -1"
        ],
        explanationImage: 'https://i.ibb.co/8tPybxt/Trinomial-Factoring-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            const b1 = randInt(2, 10), b2 = randInt(2, 10), a_coeff = randInt(2, 4);
            const B_coeff = a_coeff * (b1 + b2), C_coeff = a_coeff * b1 * b2;
            const hasXFactor = Math.random() < 0.5;
            if (hasXFactor) {
                return { questionText: `One of the factors of $$${a_coeff}x^3 + ${B_coeff}x^2 + ${C_coeff}x$$ is (x + b), where b is a positive constant. What is the smallest possible value of b?`, answer: Math.min(b1, b2) };
            } else {
                const b3 = randInt(2, 10);
                const B_noX = a_coeff * (b1 + b2 + b3), C_noX = a_coeff * (b1 * b2 + b1 * b3 + b2 * b3), D_noX = a_coeff * b1 * b2 * b3;
                return { questionText: `One of the factors of $$${a_coeff}x^3 + ${B_noX}x^2 + ${C_noX}x + ${D_noX}$$ is (x + b), where b is a positive constant. What is the smallest possible value of b?`, answer: Math.min(b1, b2, b3) };
            }
        }
    },

    {
        id: 'Factoring a Quartic Function',
        title: '(Hard) Factoring a Quartic Function',
        difficulty: 'hard',
        perfectTime: 120,
        tips: [
            "The key here is that all a, b, c and d must all be integers",
            "We can find k by finding the gcf of the three coefficients given (use the Desmos gcf (or gcd, same thing) built-in function), then run a regression and try values until one makes all the values integers.",
            "After you've found four integer values for a, b, c and d, check the value of both ab and cd.",
            "A shorter regression not shown in the example is [ac , ad+bc , bd]~[q/k , s/k , t/k] where 'q', 's' and 't' are the coefficients of x⁴, x² and x⁰, respectively."
        ],
        explanationImage: 'https://i.ibb.co/gMZw01Qp/Factoring-a-Quartic-Function-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            function getIntegerFactors(num) {
                const factors = new Set(), absNum = Math.abs(num);
                for (let i = 1; i <= Math.sqrt(absNum); i++) {
                    if (absNum % i === 0) { factors.add(i); factors.add(absNum / i); }
                }
                return Array.from(factors).sort((x, y) => x - y);
            }
            let coeff_x4, coeff_x2, coeff_const, smallest_ab, isSolvable = false;
            while (!isSolvable) {
                const k = randInt(1, 3), a = randInt(1, 5), b = randInt(1, 10), c = randInt(1, 5), d = randInt(1, 10);
                coeff_x4 = k * a * c; coeff_x2 = k * (a * d + b * c); coeff_const = k * b * d;
                const possible_ab_values = new Set();
                const x4_factors = getIntegerFactors(coeff_x4), const_factors = getIntegerFactors(coeff_const);
                for (const ac of x4_factors) {
                    const ac_prime = coeff_x4 / ac;
                    for (const bd of const_factors) {
                        const bd_prime = coeff_const / bd;
                        if ((ac * bd_prime + ac_prime * bd) === coeff_x2) possible_ab_values.add(ac * bd);
                    }
                }
                if (possible_ab_values.size > 0) { smallest_ab = Math.min(...possible_ab_values); isSolvable = true; }
            }
            return { questionText: `The given quadratic function $$${coeff_x4}x^4 + ${coeff_x2}x^2 + ${coeff_const}$$ has factors in the form $$(k)(ax^2 + b)(cx^2 + d)$$ If a, b, c, d, and k are positive integers, what is the smallest possible value of ab?`, answer: smallest_ab };
        }
    },

    {
        id: 'Quadratic and Linear Intersection',
        title: '(Hard) Quadratic and Linear Intersection',
        difficulty: 'hard',
        perfectTime: 120,
        tips: [
            "Here, we can use a regression and the -b/2a form of the vertex to find the answer 'a'",
            "Since the system of equations has exactly ONE solution, the vertex of the quadratic is on the horizontal line signified by y=(value)",
            "Because of this, we can do f(v)=(y-value) where 'v' is the vertex (-b/2a) where 'b' is the coefficient of 'x' and 'a' is the coefficient of x²"
        ],
        explanationImage: 'https://i.ibb.co/zWXZPRjV/Quadratic-and-Linear-Intersection-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let A_coeff, b_coeff, c_const, a;
            while (true) {
                A_coeff = randNonZero(2, 8);
                b_coeff = randInt(1, 10);
                if (b_coeff % 2 !== 0) b_coeff += 1;
                c_const = randInt(-10, 10);
                a = c_const + (b_coeff * b_coeff) / (4 * A_coeff);
                if (Number.isInteger(a) && a > 0) break;
            }
            return { questionText: `In the given system of equations, a is a positive constant. The system has exactly one distinct real solution. What is the value of a? $$y = ${c_const}$$ $$y = ${A_coeff}x^2 + ${b_coeff}x + a$$`, answer: a };
        }
    },

    {
        id: 'Quadratic Regression Limit',
        title: '(Hard) Quadratic Regression Limit',
        difficulty: 'hard',
        perfectTime: 120,
        tips: [
            "We are given one point on the parabola: the vertex. Two other points are the x-intercepts",
            "Like in the Parabola Symmetry category, the x-intercepts' x-values are the vertex's ± 'd'",
            "We can plot these three points in a table and run a regression with them. As we increase the value of 'd', the value of 'a+b+c' decreases",
            "This question can actually be solved simply by doing y+1, since substituting x=1 into the vertex form gives the answer"
        ],
        explanationImage: 'https://i.ibb.co/8DktjdVy/Quadratic-Regression-Limit-Example.png',
        desmosExpressions: [],
        questionGenerator: function() {
            let h, k, answer;
            do {
                h = Math.floor(Math.random() * 11) - 5;
                k = Math.floor(Math.random() * 11) - 15;
                answer = 1 + k;
            } while (answer + 1 === k);
            return { questionText: `In the xy-plane, a parabola has vertex (${h}, ${k}) and intersects the x-axis at two points. The equation of the parabola is written in the form $$y = ax^2 + bx + c$$ where a, b, c are constants. What is the smallest possible integer value of a+b+c?`, answer: parseFloat(answer.toFixed(3)) };
        }
    }
];
