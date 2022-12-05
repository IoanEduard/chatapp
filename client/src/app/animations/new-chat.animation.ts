import { animate, keyframes, state, style, transition, trigger } from "@angular/animations";

export const load = [
    trigger('load', [
      state('left', style({ 'width': '0px' })),
      state('right', style({ 'width': '500px' })),
      state('reset', style({ 'width': '0px' })),
      transition('left <=> right', [
        animate(5000)
      ]),
       transition('reset => *', [
        animate(5000)
      ]),
    ])
  ];

  export const old = [
    trigger('openClose', [
        state('true', style({
          height: '100px',
          opacity: 1,
          backgroundColor: 'green'
        })),
        state('false', style({
          height: '100px',
          opacity: 1,
          backgroundColor: 'white'
        })),
        // ...
        transition('* => *', [
          animate('2s', keyframes([
            style({ opacity: 0.9, offset: 0.1 }),
            style({ opacity: 1, offset: 0.3 }),
            style({ opacity: 2, offset: 0.5 }),
            style({ opacity: 0.9, offset: 0.7 })
          ]))
        ])
      ])
  ]