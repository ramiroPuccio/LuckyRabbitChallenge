export default class Api {

	max_options = 8;

	play(selectedValue) {
		let rnd = Math.round(Math.random() * (this.max_options - 1));
		return {
			draw: rnd,
			selected: selectedValue,
			won: rnd == selectedValue
		}
	}

};