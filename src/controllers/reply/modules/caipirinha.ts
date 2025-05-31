export const caipirinhaCalculator = (textReceived: string): string => {
	// Validade the input, must be
	// caipirinha <float>
	const split = textReceived.split(" ");
	if (split.length !== 2) {
		return "* Comando inválido, deve ser:\n'caipirinha limao_em_gramas'\nExemplo: 'caipirinha 100'";
	}

	// Parse the float
	const lemonWeightG = parseFloat(split[1]);
	if (isNaN(lemonWeightG)) {
		return "* Comando inválido, deve ser:\n'caipirinha limao_em_gramas'\nExemplo: 'caipirinha 100'";
	}

	// Receipt = 120g lemon, 25g sugar, 70ml cachaça, 8 a 10 ice cubes
	const cachaca = lemonWeightG * 0.583;
	const cachacaGramas = cachaca * 0.55;

	const sugar = lemonWeightG * 0.208;

	const minIce = lemonWeightG * 0.066;
	const maxIce = lemonWeightG * 0.083;

	return `Para fazer uma caipirinha com ${lemonWeightG}g de limão, você vai precisar de:\n${sugar.toFixed(1)}g de açúcar\n${cachaca.toFixed(1)}ml de cachaça (${cachacaGramas.toFixed(1)}g de velho barreiro)\n${Math.round(minIce)} a ${Math.round(maxIce)} pedras de gelo.`;
};
