
import { useState, useEffect, createRef } from "react";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router";
import { AddBox, Edit, Visibility } from "@material-ui/icons";
import MuiTable from "../../components/table/table_index";
import { BASE_URL, PATH_VETERIAN } from "../../utils/constants";
import { PATH_PET } from "../../utils/constants";
import makeApiCall from "../../utils/makeApiCall";

function VeterianTable() {

  const tableRef = createRef();
  const snackbar = useSnackbar();
  const navigate =  useNavigate();



  const [Pets, setPets] = useState({});

  useEffect(() => {
    const fetchPets = async () => {
      const typesResponse = await makeApiCall(
        `${BASE_URL}${PATH_PET}`
      );
      const jsonResp = await typesResponse.json();
      const types = {};
      jsonResp.value.forEach(
        (item) =>
        (types[`${item.Pet_id}`] = item.Breed)
      );
      setPets(types);
    };
    fetchPets();
  }, []);

  const columns = [
      { title: "VetName", field: "VetName" },
      { title: "VetSpecialization", field: "VetSpecialization" },
      { title: "VetDescription", field: "VetDescription" },
      { title: "Examinehealth", field: "VeterianExaminehealth", lookup: Pets },
  ];
  
  const fetchData = async (query) => {
    return new Promise((resolve, reject) => {
      const { page, orderBy, orderDirection, search, pageSize } = query;
      const url = `${BASE_URL}${PATH_VETERIAN}`;
      let temp = url; // Initialize with the base URL
      let filterQuery = ""; // Initialize filter query as an empty string
  
      // Handle sorting
      if (orderBy) {
        temp += `?$orderby=${orderBy.field} ${orderDirection}`;
      }
  
      // Handle searching
      if (search) {
        filterQuery = `$filter=contains($screen.getSearchField().getName(), '${search}')`;
        temp += orderBy ? `&${filterQuery}` : `?${filterQuery}`;
      }
  
      // Handle pagination
      if (page > 0) {
        const skip = page * pageSize;
        temp += orderBy || search ? `&$skip=${skip}` : `?$skip=${skip}`;
      }
  
      const countUrl = search ? `${url}/$count?${filterQuery}` : `${BASE_URL}${PATH_VETERIAN}/$count`;
      let total = null;
  
      makeApiCall(countUrl)
        .then((res) => res.text())
        .then((e) => {
          total = parseInt(e, 10);
        })
        .then(() => makeApiCall(temp))
        .then((res) => res.json())
        .then(({ value }) => {
          return resolve({
            data: value,
            page: page,
            totalCount: total,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  return (
    <div className="product-container">
      {
      Object.keys(Pets).length > 0 && 
      (
        <MuiTable
          tableRef={tableRef}
          title="Vets"
          cols={columns}
          data={fetchData}
          size={5}
          actions={[
            {
              icon: AddBox,
              tooltip: "Add",
              onClick: () => navigate("/Veterians/create"),
              isFreeAction: true,
            },
            {
              icon: Visibility,
              tooltip: "View",
              onClick: (event, rowData) =>
              navigate(`/Veterians/view/${rowData.Vet_id}`),
            },
            {
              icon: Edit,
              tooltip: "Edit",
              onClick: (event, rowData) =>
              navigate(`/Veterians/edit/${rowData.Vet_id}`),
            },
          ]}
          onRowDelete={async (oldData) => {
            const resp = await makeApiCall(
              `${BASE_URL}${PATH_VETERIAN}(${oldData.Vet_id})`,
              "DELETE"
            );
            if (resp.ok) {
              tableRef.current.onQueryChange();
              snackbar.enqueueSnackbar("Successfully deleted Veterians", {
                variant: "success",
              });
            } else {
              const jsonData = await resp.json();
              snackbar.enqueueSnackbar(`Failed! - ${jsonData.message}`, {
                variant: "error",
              });
            }
          }}
        />
      )}
    </div>
  );
}

export default VeterianTable;
