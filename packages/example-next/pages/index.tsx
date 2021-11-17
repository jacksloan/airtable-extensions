import { api, Location, Person, Place } from './_api';

// posts will be populated at build time by getStaticProps()
function Index({ places, people, locations }) {
  return (
    <>
      <section>
        <h2>Places</h2>
        <ul>
          {places.map((p: Place) => (
            <>
              <li>
                Name = {p.name}, Active = {p.active}
              </li>
            </>
          ))}
        </ul>
      </section>

      <br />
      <hr />
      <br />

      <section>
        <h2>People</h2>
        <ul>
          {people.map((p: Person) => (
            <>
              <li>
                First = {p.firstName}, Last = {p.lastName}
              </li>
            </>
          ))}
        </ul>
      </section>

      <br />
      <hr />
      <br />

      <section>
        <h2>Locations</h2>
        <ul>
          {locations.map((l: Location) => (
            <>
              <li>
                Name = {l.name}, Description = {l.description}
              </li>
            </>
          ))}
        </ul>
      </section>
    </>
  );
}

export async function getStaticProps() {
  const places = await api.places.findAll();
  const locations = await api.locations.findAll();
  const people = await api.people.findAll();

  console.log(places, locations, people);

  return {
    props: {
      places: places || [],
      locations: locations || [],
      people: people || [],
    },
  };
}

export default Index;
